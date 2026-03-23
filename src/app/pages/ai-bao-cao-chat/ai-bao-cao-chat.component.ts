import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { AiBaoCaoReportType } from '../../models/ai-bao-cao-chat.model';
import { MenuComponent } from '../../components/menu/menu.component';
import { getErrorMessage } from '../../utils/error.util';
import { AiBaoCaoChatService } from './ai-bao-cao-chat.service';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  highlights?: string[];
  suggestedQuestions?: string[];
  meta?: string;
}

@Component({
  selector: 'app-ai-bao-cao-chat',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MenuComponent,
    NzBreadCrumbModule,
    NzButtonModule,
    NzCardModule,
    NzDatePickerModule,
    NzInputModule,
    NzSelectModule,
    NzTagModule
  ],
  templateUrl: './ai-bao-cao-chat.component.html',
  styleUrl: './ai-bao-cao-chat.component.scss'
})
export class AiBaoCaoChatComponent {
  loading = false;
  readonly reportTypeOptions: Array<{ label: string; value: AiBaoCaoReportType }> = [
    { label: 'Tự nhận diện', value: 'AUTO' },
    { label: 'Ngày', value: 'DAY' },
    { label: 'Tháng', value: 'MONTH' },
    { label: 'Quý', value: 'QUARTER' },
    { label: 'Năm', value: 'YEAR' }
  ];

  readonly quickPrompts: string[] = [
    'Tóm tắt doanh thu và lợi nhuận tháng này',
    'So sánh doanh thu kỳ này với kỳ trước',
    'Top 5 thuốc bán chạy nhất hiện tại',
    'Tồn kho nào có rủi ro cần xử lý ngay?',
    'Khách hàng đóng góp doanh thu cao nhất là ai?'
  ];

  private readonly fb = inject(FormBuilder);
  readonly form = this.fb.group({
    question: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(1000)]),
    reportType: this.fb.nonNullable.control<AiBaoCaoReportType>('AUTO'),
    dateRange: this.fb.control<[Date, Date] | null>(null)
  });

  messages: ChatMessage[] = [
    {
      role: 'assistant',
      text: 'Bạn có thể hỏi nhanh về doanh thu, lợi nhuận, tồn kho, thuốc bán chạy hoặc khách hàng. Tôi sẽ tổng hợp dữ liệu báo cáo và trả lời ngắn gọn.',
      suggestedQuestions: [
        'Doanh thu thuần tháng này là bao nhiêu?',
        'Nhóm thuốc nào đang bán chậm?',
        'Rủi ro tồn kho cần ưu tiên xử lý hôm nay?'
      ]
    }
  ];

  private readonly service = inject(AiBaoCaoChatService);
  private readonly notification = inject(NzNotificationService);

  async submitQuestion(): Promise<void> {
    if (this.form.invalid || this.loading) {
      this.form.markAllAsTouched();
      return;
    }

    const question = this.form.controls.question.value.trim();
    this.messages.push({ role: 'user', text: question });
    this.form.controls.question.setValue('');

    this.loading = true;
    try {
      const range = this.form.controls.dateRange.value;
      const selectedReportType = this.form.controls.reportType.value;
      const response = await this.service.query({
        question,
        reportType: selectedReportType === 'AUTO' ? undefined : selectedReportType,
        fromDate: range && range[0] ? this.formatDate(range[0]) : undefined,
        toDate: range && range[1] ? this.formatDate(range[1]) : undefined
      });

      this.messages.push({
        role: 'assistant',
        text: response.answer,
        highlights: response.highlights,
        suggestedQuestions: response.suggestedQuestions,
        meta: `Intent: ${response.intent} | Kỳ: ${response.reportType} | Nguồn: ${response.source} | Model: ${response.model}`
      });
    } catch (error) {
      const message = getErrorMessage(error, 'Không thể tạo phản hồi AI báo cáo');
      this.notification.error('Thất bại', message);
      this.messages.push({
        role: 'assistant',
        text: 'Tôi chưa lấy được dữ liệu để trả lời. Vui lòng thử lại với câu hỏi ngắn hơn hoặc chọn lại kỳ báo cáo.'
      });
    } finally {
      this.loading = false;
    }
  }

  usePrompt(prompt: string): void {
    this.form.controls.question.setValue(prompt);
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
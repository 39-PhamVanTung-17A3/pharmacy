import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzTableModule } from 'ng-zorro-antd/table';
import { MenuComponent } from '../../components/menu/menu.component';
import { PaggingComponent } from '../../components/pagging/pagging.component';
import { ImportPayload, PopupNhapHangComponent } from './popup-nhap-hang/popup-nhap-hang.component';

interface ImportItem {
  code: string;
  medicineName: string;
  supplier: string;
  quantity: number;
  importPrice: number;
  sellPrice: number;
  expiryDate: string;
  importedAt: string;
}

@Component({
  selector: 'app-nhap-hang',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MenuComponent,
    PaggingComponent,
    PopupNhapHangComponent,
    NzBreadCrumbModule,
    NzButtonModule,
    NzCardModule,
    NzIconModule,
    NzInputModule,
    NzTableModule
  ],
  templateUrl: './nhap-hang.component.html',
  styleUrl: './nhap-hang.component.scss'
})
export class NhapHangComponent {
  isPopupOpen = false;
  pageIndex = 1;
  readonly pageSize = 5;

  private readonly fb = inject(FormBuilder);

  readonly filterForm = this.fb.nonNullable.group({
    keyword: ['']
  });

  importList: ImportItem[] = [
    {
      code: 'PN000045',
      medicineName: 'Paracetamol 500mg',
      supplier: 'Công ty Dược Minh Tâm',
      quantity: 200,
      importPrice: 3200,
      sellPrice: 5000,
      expiryDate: '2027-01-20',
      importedAt: '2026-03-03'
    },
    {
      code: 'PN000044',
      medicineName: 'Panadol Extra',
      supplier: 'Công ty Dược An Khang',
      quantity: 50,
      importPrice: 96000,
      sellPrice: 120000,
      expiryDate: '2027-05-15',
      importedAt: '2026-03-02'
    },
    {
      code: 'PN000043',
      medicineName: 'Vitamin C 1000mg',
      supplier: 'Công ty Dược Á Châu',
      quantity: 80,
      importPrice: 76000,
      sellPrice: 98000,
      expiryDate: '2027-08-10',
      importedAt: '2026-03-01'
    }
  ];

  get filteredImports(): ImportItem[] {
    const keyword = this.filterForm.controls.keyword.value.trim().toLowerCase();
    if (!keyword) {
      return this.importList;
    }

    return this.importList.filter(
      (item) =>
        item.code.toLowerCase().includes(keyword) ||
        item.medicineName.toLowerCase().includes(keyword) ||
        item.supplier.toLowerCase().includes(keyword)
    );
  }

  get pagedImports(): ImportItem[] {
    const start = (this.pageIndex - 1) * this.pageSize;
    return this.filteredImports.slice(start, start + this.pageSize);
  }

  openPopup(): void {
    this.isPopupOpen = true;
  }

  closePopup(): void {
    this.isPopupOpen = false;
  }

  onPageChange(page: number): void {
    this.pageIndex = page;
  }

  addImport(payload: ImportPayload): void {
    this.importList = [
      {
        code: `PN${String(this.importList.length + 46).padStart(6, '0')}`,
        medicineName: payload.medicineName,
        supplier: payload.supplier,
        quantity: payload.quantity,
        importPrice: payload.importPrice,
        sellPrice: payload.sellPrice,
        expiryDate: payload.expiryDate,
        importedAt: payload.importedAt
      },
      ...this.importList
    ];
    this.pageIndex = 1;
  }
}

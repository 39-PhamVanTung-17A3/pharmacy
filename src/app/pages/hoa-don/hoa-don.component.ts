import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzTableModule } from 'ng-zorro-antd/table';
import { MenuComponent } from '../../components/menu/menu.component';

interface BillItem {
  name: string;
  stockLabel: string;
  price: number;
  quantity: number;
}

@Component({
  selector: 'app-hoa-don',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MenuComponent,
    NzBreadCrumbModule,
    NzButtonModule,
    NzCardModule,
    NzDividerModule,
    NzInputModule,
    NzInputNumberModule,
    NzTableModule
  ],
  templateUrl: './hoa-don.component.html',
  styleUrl: './hoa-don.component.scss'
})
export class HoaDonComponent {
  private readonly fb = inject(FormBuilder);

  readonly saleForm = this.fb.nonNullable.group({
    keyword: ['']
  });

  readonly customerForm = this.fb.nonNullable.group({
    customerName: ['Khách lẻ', [Validators.maxLength(120)]],
    phone: ['']
  });

  readonly paymentForm = this.fb.nonNullable.group({
    discount: [0],
    amountPaid: [100000]
  });

  billItems: BillItem[] = [
    { name: 'Paracetamol 500mg', stockLabel: 'Vỉ 10 viên', price: 15000, quantity: 2 },
    { name: 'Panadol Extra', stockLabel: 'Hộp 12 vỉ', price: 45000, quantity: 1 }
  ];

  get subtotal(): number {
    return this.billItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  get discount(): number {
    return Number(this.paymentForm.controls.discount.value) || 0;
  }

  get totalNeedPay(): number {
    return Math.max(this.subtotal - this.discount, 0);
  }

  get amountPaid(): number {
    return Number(this.paymentForm.controls.amountPaid.value) || 0;
  }

  get returnAmount(): number {
    return this.amountPaid - this.totalNeedPay;
  }

  increaseQty(index: number): void {
    this.billItems[index].quantity += 1;
    this.billItems = [...this.billItems];
  }

  decreaseQty(index: number): void {
    if (this.billItems[index].quantity <= 1) {
      return;
    }
    this.billItems[index].quantity -= 1;
    this.billItems = [...this.billItems];
  }

  updatePrice(index: number, value: number | null): void {
    const nextValue = Math.max(Number(value) || 0, 0);
    this.billItems[index].price = nextValue;
    this.billItems = [...this.billItems];
  }

  removeItem(index: number): void {
    this.billItems = this.billItems.filter((_, itemIndex) => itemIndex !== index);
  }

  clearBill(): void {
    this.billItems = [];
  }
}

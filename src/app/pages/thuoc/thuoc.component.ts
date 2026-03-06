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
import { MedicinePayload, PopupThuocComponent } from './popup-thuoc/popup-thuoc.component';

interface MedicineCategory {
  id: number;
  name: string;
}

interface MedicineItem {
  name: string;
  category: MedicineCategory;
  unit: string;
  quantity: number;
  expiryDate: string;
}

@Component({
  selector: 'app-thuoc',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MenuComponent,
    PaggingComponent,
    PopupThuocComponent,
    NzBreadCrumbModule,
    NzButtonModule,
    NzCardModule,
    NzIconModule,
    NzInputModule,
    NzTableModule
  ],
  templateUrl: './thuoc.component.html',
  styleUrl: './thuoc.component.scss'
})
export class ThuocComponent {
  isPopupOpen = false;
  pageIndex = 1;
  readonly pageSize = 5;

  private readonly fb = inject(FormBuilder);

  readonly filterForm = this.fb.nonNullable.group({
    keyword: ['']
  });

  medicineList: MedicineItem[] = [
    {
      name: 'Amoxicillin 500mg',
      category: { id: 1, name: 'Kháng sinh' },
      unit: 'Vỉ',
      quantity: 250,
      expiryDate: '2026-12-30'
    },
    {
      name: 'Panadol Extra',
      category: { id: 2, name: 'Giảm đau' },
      unit: 'Hộp',
      quantity: 20,
      expiryDate: '2027-02-15'
    },
    {
      name: 'Augmentin 625mg',
      category: { id: 1, name: 'Kháng sinh' },
      unit: 'Hộp',
      quantity: 85,
      expiryDate: '2026-11-01'
    },
    {
      name: 'Decolgen ND',
      category: { id: 2, name: 'Giảm đau' },
      unit: 'Vỉ',
      quantity: 142,
      expiryDate: '2027-01-30'
    },
    {
      name: 'Paracetamol 500mg',
      category: { id: 2, name: 'Giảm đau' },
      unit: 'Vỉ',
      quantity: 500,
      expiryDate: '2026-10-10'
    },
    {
      name: 'Vitamin C 1000mg',
      category: { id: 3, name: 'Vitamin' },
      unit: 'Hộp',
      quantity: 70,
      expiryDate: '2027-03-21'
    }
  ];

  get filteredMedicines(): MedicineItem[] {
    const keyword = this.filterForm.controls.keyword.value.trim().toLowerCase();
    if (!keyword) {
      return this.medicineList;
    }

    return this.medicineList.filter(
      (item) => item.name.toLowerCase().includes(keyword) || item.category.name.toLowerCase().includes(keyword)
    );
  }

  get pagedMedicines(): MedicineItem[] {
    const start = (this.pageIndex - 1) * this.pageSize;
    return this.filteredMedicines.slice(start, start + this.pageSize);
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

  addMedicine(payload: MedicinePayload): void {
    this.medicineList = [
      {
        name: payload.name,
        category: payload.category,
        unit: payload.unit,
        quantity: payload.quantity,
        expiryDate: ''
      },
      ...this.medicineList
    ];
    this.pageIndex = 1;
  }
}

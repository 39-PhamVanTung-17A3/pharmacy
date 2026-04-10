import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
  forwardRef,
  inject
} from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { NzTreeNodeOptions } from 'ng-zorro-antd/core/tree';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzFormatEmitEvent } from 'ng-zorro-antd/tree';
import { NzTreeSelectComponent, NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import { getErrorMessage } from '../../../../utils/error.util';
import { NhapHang, NhapHangService } from '../../../nhap-hang/nhap-hang.service';
import { Thuoc, ThuocService } from '../../../thuoc/thuoc.service';
import { LotPickerPopupComponent } from '../lot-picker-popup/lot-picker-popup.component';

export interface SelectedMedicineImportPayload {
  importItem: NhapHang;
  imageUrl: string | null;
}

interface MedicineOptionItem {
  id: number;
  name: string;
  searchText: string;
  imageUrl: string | null;
  totalQuantity: number;
}

@Component({
  selector: 'app-medicine-import-tree-select',
  standalone: true,
  imports: [CommonModule, FormsModule, NzTreeSelectModule, NzIconModule, LotPickerPopupComponent],
  templateUrl: './medicine-import-tree-select.component.html',
  styleUrl: './medicine-import-tree-select.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MedicineImportTreeSelectComponent),
      multi: true
    }
  ]
})
export class MedicineImportTreeSelectComponent implements OnInit, OnChanges, ControlValueAccessor {
  private readonly nhapHangService = inject(NhapHangService);
  private readonly thuocService = inject(ThuocService);
  private readonly notification = inject(NzNotificationService);

  @Input() placeholder = 'Chọn thuốc theo lô nhập';
  @Input() reloadToken = 0;
  @Output() importSelected = new EventEmitter<SelectedMedicineImportPayload>();
  @Output() cameraClick = new EventEmitter<void>();
  @Output() addMedicineClick = new EventEmitter<void>();

  @ViewChild('medicineTreeSelect') medicineTreeSelect?: NzTreeSelectComponent;

  selectionMode: 'modern' | 'tree' = 'modern';
  medicineKeyword = '';
  medicineOptions: MedicineOptionItem[] = [];
  filteredMedicineOptions: MedicineOptionItem[] = [];
  visibleMedicineCount = 24;
  readonly modernPageSize = 24;
  loadingMedicineTree = false;
  quickAddingMedicineId: number | null = null;

  importPickerOpen = false;
  importPickerMedicineName = '';
  importPickerImports: NhapHang[] = [];
  importPickerLoading = false;

  medicineImportTreeNodes: NzTreeNodeOptions[] = [];
  readonly medicineDropdownStyle: Record<string, string> = {
    maxHeight: '420px',
    overflowY: 'auto'
  };
  allMedicineTreeNodes: NzTreeNodeOptions[] = [];
  expandedMedicineKeys: string[] = [];
  medicineTreeOpen = false;
  medicineTreeSearchKeyword = '';

  private importOptionsById = new Map<number, NhapHang>();
  private medicineImageById = new Map<number, string | null>();
  private importsByMedicineId = new Map<number, NhapHang[]>();
  private medicineSearchTokensById = new Map<number, string>();
  private loadedMedicineNodeKeys = new Set<string>();
  private loadingMedicineNodeKeys = new Set<string>();
  selectedImportKey: string | null = null;
  private disabled = false;

  private onChange: (value: string | null) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  async ngOnInit(): Promise<void> {
    await this.loadMedicineTreeByMedicine();
  }

  async ngOnChanges(changes: SimpleChanges): Promise<void> {
    if (changes['reloadToken'] && !changes['reloadToken'].firstChange) {
      await this.loadMedicineTreeByMedicine();
    }
  }

  writeValue(value: string | null): void {
    this.selectedImportKey = value;
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  get isDisabled(): boolean {
    return this.disabled;
  }

  get showEmptyHint(): boolean {
    return !this.loadingMedicineTree && this.medicineImportTreeNodes.length === 0;
  }

  get showModernEmptyHint(): boolean {
    return !this.loadingMedicineTree && this.filteredMedicineOptions.length === 0;
  }

  get visibleMedicineOptions(): MedicineOptionItem[] {
    return this.filteredMedicineOptions.slice(0, this.visibleMedicineCount);
  }

  get hasMoreMedicineToShow(): boolean {
    return this.visibleMedicineCount < this.filteredMedicineOptions.length;
  }

  trackByMedicineId(_: number, item: MedicineOptionItem): number {
    return item.id;
  }


  displayMedicineNode = (node: { origin?: Record<string, unknown>; title?: string | null }): string => {
    const displayTitle = typeof node?.origin?.['displayTitle'] === 'string' ? (node.origin['displayTitle'] as string) : '';
    return displayTitle || String(node?.title ?? '');
  };

  isMedicineNode(origin: Record<string, unknown> | null | undefined): boolean {
    return String(origin?.['key'] ?? '').startsWith('medicine-');
  }

  toStringValue(value: unknown): string {
    return String(value ?? '');
  }

  setSelectionMode(mode: 'modern' | 'tree'): void {
    this.selectionMode = mode;
  }

  onCameraClick(): void {
    this.cameraClick.emit();
  }

  onAddMedicineClick(): void {
    this.addMedicineClick.emit();
  }

  onMedicineKeywordInput(event: Event): void {
    const target = event?.target as HTMLInputElement | null;
    this.medicineKeyword = target?.value ?? '';
    this.applyModernMedicineFilter();
  }

  onModernGridScroll(event: Event): void {
    if (!this.hasMoreMedicineToShow) {
      return;
    }

    const target = event.target as HTMLElement | null;
    if (!target) {
      return;
    }

    const remaining = target.scrollHeight - target.scrollTop - target.clientHeight;
    if (remaining > 80) {
      return;
    }

    this.visibleMedicineCount += this.modernPageSize;
  }

  async onModernMedicinePick(item: MedicineOptionItem): Promise<void> {
    if (this.isDisabled || this.quickAddingMedicineId !== null) {
      return;
    }

    this.quickAddingMedicineId = item.id;
    try {
      const imports = await this.ensureMedicineImportsLoaded(item.id);
      if (imports.length === 0) {
        this.notification.warning('Cảnh báo', 'Thuốc này chưa có lô bán khả dụng hoặc đã hết hàng');
        return;
      }

      if (imports.length === 1) {
        this.emitSelectedImport(imports[0]);
        return;
      }

      const lotQuantityOverOneCount = imports.filter((importItem) => importItem.quantity > 1).length;
      if (lotQuantityOverOneCount > 1) {
        this.openImportPicker(item, imports);
        return;
      }

      this.emitSelectedImport(imports[0]);
    } finally {
      this.quickAddingMedicineId = null;
    }
  }

  closeImportPicker(): void {
    this.importPickerOpen = false;
    this.importPickerMedicineName = '';
    this.importPickerImports = [];
    this.importPickerLoading = false;
  }

  onImportPickerSelect(importItem: NhapHang): void {
    if (this.isDisabled) {
      return;
    }
    this.emitSelectedImport(importItem);
    this.closeImportPicker();
  }

  onMedicineTreeOpenChange(isOpen: boolean): void {
    this.medicineTreeOpen = isOpen;
    if (!isOpen) {
      this.medicineTreeSearchKeyword = '';
      this.medicineTreeSelect?.setInputValue('');
      this.applyMedicineTreeFilter();
      return;
    }
    this.syncMedicineTreeKeywordFromInput();
    this.applyMedicineTreeFilter();
  }

  onMedicineTreeInput(event: Event): void {
    const target = event?.target as HTMLInputElement | null;
    this.medicineTreeSearchKeyword = target?.value ?? this.medicineTreeSearchKeyword;
    this.applyMedicineTreeFilter();
  }

  onMedicineTreeCleared(): void {
    this.medicineTreeSearchKeyword = '';
    this.applyMedicineTreeFilter();
    this.selectedImportKey = null;
    this.onChange(null);
  }

  onTreeModelChange(selectedKey: string | null): void {
    this.selectedImportKey = selectedKey;
    this.onChange(selectedKey);
    this.onTouched();

    if (!selectedKey || !selectedKey.startsWith('import-')) {
      return;
    }

    const importId = Number(selectedKey.replace('import-', ''));
    const selectedImport = this.importOptionsById.get(importId);
    if (!selectedImport) {
      return;
    }

    this.emitSelectedImport(selectedImport);
  }

  async onMedicineNodeExpand(event: NzFormatEmitEvent): Promise<void> {
    this.syncMedicineTreeKeywordFromInput();

    const node = event.node;
    if (!node || event.eventName !== 'expand') {
      return;
    }

    const medicineKey = String(node.key ?? '');
    if (!medicineKey.startsWith('medicine-')) {
      return;
    }

    this.setMedicineExpandedState(medicineKey, node.isExpanded);
    if (!node.isExpanded) {
      return;
    }
    await this.ensureMedicineNodeChildrenLoaded(medicineKey);
  }

  async onMedicineNodeClick(event: NzFormatEmitEvent): Promise<void> {
    const node = event.node;
    if (!node || event.eventName !== 'click') {
      return;
    }

    const medicineKey = String(node.key ?? '');
    if (!medicineKey.startsWith('medicine-') || node.isLeaf) {
      return;
    }

    const singleImportKey = this.getSingleImportKeyForMedicineNode(medicineKey);
    if (node.isExpanded && singleImportKey) {
      this.onTreeModelChange(singleImportKey);
      return;
    }

    const nextExpanded = !this.expandedMedicineKeys.includes(medicineKey);
    this.setMedicineExpandedState(medicineKey, nextExpanded);
    if (nextExpanded) {
      await this.ensureMedicineNodeChildrenLoaded(medicineKey);
    }
  }

  private openImportPicker(medicine: MedicineOptionItem, imports: NhapHang[]): void {
    this.importPickerMedicineName = medicine.name;
    this.importPickerImports = imports;
    this.importPickerOpen = true;
  }

  private getSingleImportKeyForMedicineNode(medicineKey: string): string | null {
    const medicineNode = this.allMedicineTreeNodes.find((item) => String(item.key) === medicineKey);
    if (!medicineNode || !medicineNode.children || medicineNode.children.length !== 1) {
      return null;
    }
    const childKey = String(medicineNode.children[0].key ?? '');
    return childKey.startsWith('import-') ? childKey : null;
  }

  private setMedicineExpandedState(medicineKey: string, expanded: boolean): void {
    if (!expanded) {
      this.expandedMedicineKeys = this.expandedMedicineKeys.filter((key) => key !== medicineKey);
      return;
    }
    if (!this.expandedMedicineKeys.includes(medicineKey)) {
      this.expandedMedicineKeys = [...this.expandedMedicineKeys, medicineKey];
    }
  }

  private syncMedicineTreeKeywordFromInput(): void {
    const treeSelect = this.medicineTreeSelect;
    if (!treeSelect) {
      return;
    }
    this.medicineTreeSearchKeyword = String(treeSelect.inputValue || this.medicineTreeSearchKeyword || '');
  }

  private normalizeTreeSearchText(value: string): string {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private applyMedicineTreeFilter(): void {
    const normalizedSearch = this.normalizeTreeSearchText(this.medicineTreeSearchKeyword);
    if (!normalizedSearch) {
      this.medicineImportTreeNodes = [...this.allMedicineTreeNodes];
      return;
    }

    this.medicineImportTreeNodes = this.allMedicineTreeNodes.filter((node) => {
      if (!String(node.key ?? '').startsWith('medicine-')) {
        return false;
      }
      const searchText = this.normalizeTreeSearchText(String(node['searchText'] ?? node.title ?? ''));
      return searchText.includes(normalizedSearch);
    });
  }

  private applyModernMedicineFilter(): void {
    const normalizedSearch = this.normalizeTreeSearchText(this.medicineKeyword);
    const source = this.medicineOptions;

    if (!normalizedSearch) {
      this.filteredMedicineOptions = source;
    } else {
      this.filteredMedicineOptions = source.filter((item) =>
        this.normalizeTreeSearchText(item.searchText).includes(normalizedSearch)
      );
    }

    this.visibleMedicineCount = this.modernPageSize;
  }

  private async ensureMedicineImportsLoaded(medicineId: number): Promise<NhapHang[]> {
    const cached = this.importsByMedicineId.get(medicineId);
    if (cached) {
      return cached;
    }

    const medicineKey = `medicine-${medicineId}`;
    await this.ensureMedicineNodeChildrenLoaded(medicineKey);
    return this.importsByMedicineId.get(medicineId) ?? [];
  }

  private async ensureMedicineNodeChildrenLoaded(medicineKey: string): Promise<void> {
    this.syncMedicineTreeKeywordFromInput();

    if (this.loadedMedicineNodeKeys.has(medicineKey) || this.loadingMedicineNodeKeys.has(medicineKey)) {
      return;
    }

    const medicineId = Number(medicineKey.replace('medicine-', ''));
    if (!Number.isFinite(medicineId)) {
      return;
    }

    this.loadingMedicineNodeKeys.add(medicineKey);
    try {
      const imports = await this.nhapHangService.findSaleImportsByMedicineId(medicineId);
      const sortedImports = this.sortImports(imports);
      sortedImports.forEach((item) => this.importOptionsById.set(item.id, item));
      this.importsByMedicineId.set(medicineId, sortedImports);

      const medicineSearchTokens = this.medicineSearchTokensById.get(medicineId) ?? '';
      const children: NzTreeNodeOptions[] = sortedImports.map((item) => {
        const displayTitle = `- Lô ${item.batchCode} (Kho: ${item.quantity})`;
        const searchableTitle = medicineSearchTokens ? `${displayTitle} ${medicineSearchTokens}` : displayTitle;
        return {
          title: searchableTitle,
          displayTitle,
          key: `import-${item.id}`,
          isLeaf: true,
          selectable: true
        } as NzTreeNodeOptions;
      });

      this.allMedicineTreeNodes = this.allMedicineTreeNodes.map((treeNode) => {
        if (String(treeNode.key) !== medicineKey) {
          return treeNode;
        }
        return {
          ...treeNode,
          children,
          isLeaf: children.length === 0
        };
      });

      this.applyMedicineTreeFilter();
      this.loadedMedicineNodeKeys.add(medicineKey);
    } catch (error) {
      const message = getErrorMessage(error, 'Không tải được danh sách lô nhập của thuốc');
      this.notification.error('Thất bại', message);
    } finally {
      this.loadingMedicineNodeKeys.delete(medicineKey);
    }
  }

  private async loadMedicineTreeByMedicine(): Promise<void> {
    this.loadingMedicineTree = true;
    try {
      const pageData = await this.thuocService.findAll(1, 1000);
      const medicines = pageData.items;

      this.medicineSearchTokensById.clear();
      this.medicineImageById.clear();
      this.importsByMedicineId.clear();
      this.medicineOptions = [];

      this.allMedicineTreeNodes = medicines.map((medicine: Thuoc) => {
        const hasStock = medicine.totalQuantity > 0;
        const displayTitle = `${medicine.name} (${hasStock ? `Còn hàng: ${medicine.totalQuantity}` : 'Hết hàng'})`;
        const barcode = medicine.barcode?.trim() ?? '';
        const normalizedBarcode = barcode.replace(/\s+/g, '');
        const compactBarcode = barcode.replace(/[^0-9A-Za-z]/g, '');
        const searchTokens = [barcode, normalizedBarcode, compactBarcode]
          .filter((value, index, array) => value && array.indexOf(value) === index)
          .join(' ');
        const searchableTitle = searchTokens ? `${displayTitle} ${searchTokens}` : displayTitle;

        this.medicineSearchTokensById.set(medicine.id, searchTokens);
        this.medicineImageById.set(medicine.id, medicine.imageUrl ?? null);
        this.medicineOptions.push({
          id: medicine.id,
          name: medicine.name,
          searchText: searchableTitle,
          imageUrl: medicine.imageUrl ?? null,
          totalQuantity: medicine.totalQuantity
        });

        return {
          key: `medicine-${medicine.id}`,
          title: searchableTitle,
          displayTitle,
          searchText: searchableTitle,
          imageUrl: medicine.imageUrl,
          selectable: false,
          isLeaf: !hasStock,
          disabled: false,
          children: []
        } as NzTreeNodeOptions;
      });

      this.applyMedicineTreeFilter();
      this.applyModernMedicineFilter();

      this.importOptionsById.clear();
      this.loadedMedicineNodeKeys.clear();
      this.loadingMedicineNodeKeys.clear();
      this.expandedMedicineKeys = [];
      this.closeImportPicker();
    } catch (error) {
      const message = getErrorMessage(error, 'Không tải được danh sách thuốc');
      this.notification.error('Thất bại', message);
      this.medicineImportTreeNodes = [];
      this.allMedicineTreeNodes = [];
      this.medicineOptions = [];
      this.filteredMedicineOptions = [];
      this.importOptionsById.clear();
      this.medicineSearchTokensById.clear();
      this.importsByMedicineId.clear();
      this.loadedMedicineNodeKeys.clear();
      this.loadingMedicineNodeKeys.clear();
      this.expandedMedicineKeys = [];
      this.closeImportPicker();
    } finally {
      this.loadingMedicineTree = false;
    }
  }

  private emitSelectedImport(selectedImport: NhapHang): void {
    const selectedKey = `import-${selectedImport.id}`;
    this.selectedImportKey = selectedKey;
    this.onChange(selectedKey);
    this.onTouched();

    const imageUrl = this.medicineImageById.get(selectedImport.medicineId) ?? null;
    this.importSelected.emit({
      importItem: selectedImport,
      imageUrl
    });

    this.selectedImportKey = null;
    this.onChange(null);
    this.medicineTreeSelect?.onClearSelection();
    this.medicineTreeSelect?.setInputValue('');
    this.medicineTreeOpen = false;
  }

  private sortImports(imports: NhapHang[]): NhapHang[] {
    return [...imports].sort((a, b) => {
      const expiryA = a.expiryDate ? new Date(a.expiryDate).getTime() : Number.MAX_SAFE_INTEGER;
      const expiryB = b.expiryDate ? new Date(b.expiryDate).getTime() : Number.MAX_SAFE_INTEGER;
      if (expiryA !== expiryB) {
        return expiryA - expiryB;
      }
      return new Date(a.importedAt).getTime() - new Date(b.importedAt).getTime();
    });
  }
}


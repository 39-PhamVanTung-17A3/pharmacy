export interface NhapHangApiResponse {
  id: number;
  medicineId: number;
  medicineName: string;
  batchCode: string;
  supplier: string | null;
  quantity: number;
  importPrice: number;
  sellPrice: number | null;
  expiryDate: string;
  importedAt: string;
}

export interface NhapHang {
  id: number;
  medicineId: number;
  medicineName: string;
  batchCode: string;
  supplier: string;
  quantity: number;
  importPrice: number;
  sellPrice: number;
  expiryDate: string;
  importedAt: string;
}

export interface NhapHangSaleTreeNodeApiResponse {
  title: string;
  key: string;
  selectable: boolean;
  disabled: boolean;
  isLeaf: boolean;
  children: NhapHangSaleTreeNodeApiResponse[];
}

export interface NhapHangSaleTreeApiResponse {
  treeNodes: NhapHangSaleTreeNodeApiResponse[];
  imports: NhapHangApiResponse[];
}

export interface NhapHangSaleTreeNode {
  title: string;
  key: string;
  selectable: boolean;
  disabled: boolean;
  isLeaf: boolean;
  children: NhapHangSaleTreeNode[];
}

export interface NhapHangSaleTree {
  treeNodes: NhapHangSaleTreeNode[];
  imports: NhapHang[];
}

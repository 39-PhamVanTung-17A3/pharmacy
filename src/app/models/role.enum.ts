export enum NhanVienRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  PHARMACIST = 'PHARMACIST',
  CASHIER = 'CASHIER',
  WAREHOUSE = 'WAREHOUSE'
}

export const ROLE_LABELS: Record<NhanVienRole, string> = {
  [NhanVienRole.ADMIN]: 'Quản trị',
  [NhanVienRole.MANAGER]: 'Quản lý',
  [NhanVienRole.PHARMACIST]: 'Dược sĩ',
  [NhanVienRole.CASHIER]: 'Thu ngân',
  [NhanVienRole.WAREHOUSE]: 'Kho vận'
};

export const ROLE_OPTIONS: Array<{ label: string; value: NhanVienRole }> = [
  { label: ROLE_LABELS[NhanVienRole.MANAGER], value: NhanVienRole.MANAGER },
  { label: ROLE_LABELS[NhanVienRole.ADMIN], value: NhanVienRole.ADMIN },
  { label: ROLE_LABELS[NhanVienRole.PHARMACIST], value: NhanVienRole.PHARMACIST },
  { label: ROLE_LABELS[NhanVienRole.CASHIER], value: NhanVienRole.CASHIER },
  { label: ROLE_LABELS[NhanVienRole.WAREHOUSE], value: NhanVienRole.WAREHOUSE }
];

export function parseNhanVienRole(value: string | null | undefined): NhanVienRole | null {
  const normalized = value?.trim().toUpperCase();
  return (Object.values(NhanVienRole) as string[]).includes(normalized || '') ? (normalized as NhanVienRole) : null;
}

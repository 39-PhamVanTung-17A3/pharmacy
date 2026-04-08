export interface AiTonKhoGoiYRequest {
  note?: string;
  sampleSize?: number;
}

export interface AiTonKhoGoiYApiResponse {
  tongSoCanhBao: number;
  soLuongSapHetHang: number;
  soLuongDaHetHang: number;
  soLuongSapHetHan: number;
  soLuongDaHetHan: number;
  tomTat: string;
  hanhDongUuTien: string[];
  moHinhSuDung: string;
  nguonSinhNoiDung: string;
}

export interface AiTonKhoGoiY {
  tongSoCanhBao: number;
  soLuongSapHetHang: number;
  soLuongDaHetHang: number;
  soLuongSapHetHan: number;
  soLuongDaHetHan: number;
  tomTat: string;
  hanhDongUuTien: string[];
  moHinhSuDung: string;
  nguonSinhNoiDung: string;
}

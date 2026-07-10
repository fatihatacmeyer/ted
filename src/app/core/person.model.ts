export interface Person {
  id: number;
  ad: string;
  soyad: string;
  adsoyad: string;
  sicilno: string;
  personelno: string;
  userid: string;
  firmaad: string;
  bolumad: string;
  pozisyonad: string;
  altfirmaad: string;
  direktorlukad: string;
  gorevad: string;
  yakaad: string;
  credit: number;
  indirimorani: number;
  ceptelefon: string;
  mesaiperiyodu: number;
  mesaiperiyoduad: string;
  cikistarih: string | null;
  lyetki: number;
  lkademe: number;
  userdef: number;
  userdefad: string;
  cardid: string;
  yetkistr: string;
  yetkistrad: string;
  islemno: string;
  islemsonuc: number;
  sunucucevap: string | null;
}

/**
 * Yeni sicil (kayıt) ekleme isteği için kullanılan DTO.
 * Formdan gelen alanlar + hangi component'ten geldiğini belirten userdef.
 * userdef: 11 = Öğrenci, 12 = Öğretmen, 13 = Veli
 */
export interface PersonInsertRequest {
  ad: string;
  soyad: string;
  sicilno?: string;
  personelno?: string;
  userdef: number;
}

/** Backend'in Person/Login gibi endpoint'lerden döndüğü ortak sonuç formatı. */
export interface IslemSonucResponse {
  islemsonuc: number | string;
  islemno?: string;
  sunucucevap?: string | null;
}

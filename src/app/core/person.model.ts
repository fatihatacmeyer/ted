export interface Person {
  id: number;
  ad: string;
  soyad: string;
  adsoyad: string;
  sicilno: string;
  personelno: string;
  userid: string;

  // Referans alanları — API hem ID hem text döndürebilir
  firma?: string;       // Firma ID (backend'e update'te ID olarak gönderilir)
  firmaad: string;      // Firma adı (görünen metin)
  bolum?: string;       // Bölüm ID
  bolumad: string;      // Bölüm adı
  pozisyon?: string;    // Pozisyon ID
  pozisyonad: string;   // Pozisyon adı
  altfirma?: string;    // Alt firma ID
  altfirmaad: string;   // Alt firma adı
  direktorluk?: string; // Directorate ID
  direktorlukad: string;// Directorate adı
  gorev?: string;       // Görev ID
  gorevad: string;      // Görev adı
  yaka?: string;        // Yaka ID
  yakaad: string;       // Yaka adı

  // Ek alanlar
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
  // Kişisel Bilgiler
  ad: string;
  soyad: string;
  dogumtarih?: string;
  cinsiyet?: string;
  kangrubu?: string;

  // Kimlik / Numara
  sicilno?: string;
  personelno?: string;
  cardid?: string;

  // İletişim
  ceptelefon?: string;
  telefon1?: string;
  email?: string;

  // Adres
  adres?: string;
  il?: string;
  ilce?: string;

  // Kurumsal
  firma?: string;
  bolum?: string;
  pozisyon?: string;
  gorev?: string;
  altfirma?: string;
  direktorluk?: string;
  yaka?: string;
  giristarih?: string;

  // Sistem
  userdef: number;

  // Fotoğraf (base64 data-URL veya null)
  fotoImage?: string | null;
}

/** Backend'in Person/Login gibi endpoint'lerden döndüğü ortak sonuç formatı. */
export interface IslemSonucResponse {
  islemsonuc: number | string;
  islemno?: string;
  sunucucevap?: string | null;
}

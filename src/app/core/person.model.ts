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
export interface OperationResultResponse {
  islemsonuc: number | string;
  islemno?: string;
  sunucucevap?: string | null;
}

/**
 * Login sonrası dönen kullanıcı modeli.
 * Backend hem Person alanlarını hem de auth alanlarını (tokenid, islemno vb.) döner.
 */
export interface User {
  id: number | null;
  customerCode: string;
  fullname: string;
  username: string;
  loginname: string;
  gorev: string | null;
  yetki: number | null;
  bolum: string | null;
  kademe: string | null;
  xsicilid: number | null;
  extloginname: string;
  customerName: string;
  tokenid: string;
  islemno: string;
  access: string;
  accessmenu: boolean;
  admin: boolean;
  islemsonuc: number | string;
  [key: string]: unknown; // Backend'in döndüğü ek alanlar için open-ended
}

/** Ayrılış nedeni dropdown seçeneği */
export interface ExitReason {
  tip: string;
  ad: string;
  id: number;
  [key: string]: unknown;
}

export interface LinkedPerson {
  id: number;
  name: string;
  sicilno?: string;
}

export function parseLinkedIds(raw: string | null | undefined): number[] {
  if (!raw || raw.trim() === '' || raw === '- - - - - - -') return [];
  return raw.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
}

export function serializeLinkedIds(ids: number[]): string {
  return ids.filter(n => !isNaN(n)).join(',');
}

export function resolveLinkedNames(ids: number[], allPersons: Person[]): LinkedPerson[] {
  return ids.map(id => {
    const found = allPersons.find(p => p.id === id);
    return {
      id,
      name: found ? found.adsoyad : `Bilinmeyen (#${id})`,
      sicilno: found?.sicilno ?? '',
    };
  });
}

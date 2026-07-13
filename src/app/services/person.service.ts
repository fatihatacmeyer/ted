import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, switchMap } from 'rxjs';
import { APP_CONFIG, AppConfig } from './app-config.service';
import { HelperService } from './helper.service';
import { Person, PersonInsertRequest } from '../core/person.model';
import { AuthService } from './auth.service';
import { PrepareService } from './prepare.service';

@Injectable({
  providedIn: 'root',
})
export class PersonService {
  constructor(
    private http: HttpClient,
    @Inject(APP_CONFIG) private config: AppConfig,
    private helper: HelperService,
    private authService: AuthService,
    private prepareService: PrepareService,
  ) {}

  /** Ortak: mevcut kullanıcının token'ından Authorization header'ı üretir. */
  private buildAuthHeaders(): HttpHeaders {
    const currentUser = this.authService.currentUserValue;
    const userToken = currentUser && currentUser.tokenid ? currentUser.tokenid : '';
    return new HttpHeaders({ Authorization: userToken });
  }

  /**
   * key=value çiftlerini backend'in beklediği "param" string formatına çevirir.
   * NOT: Legacy sistem (bkz. app_sicil.js) bu değerleri hiçbir zaman
   * encodeURIComponent ile encode etmiyor — çünkü tüm string zaten AES ile
   * şifrelenip gönderiliyor (bkz. PrepareService), backend de şifreyi çözdükten
   * sonra basit bir '&'/'=' split'i ile parse ediyor; URL-encoding beklemiyor.
   * Burada da encode etmiyoruz, aksi halde backend "%20" gibi karakterleri
   * literal metin olarak okur.
   */
  private buildParamString(params: Record<string, string | number>): string {
    return Object.entries(params)
      .map(([key, value]) => `${key}=${value ?? ''}`)
      .join('&');
  }

  getPersonList(): Observable<Person[]> {
    const apiUrl = `${this.config.apiUrl}/PersonList`;

    const paramString = this.buildParamString({
      islemtipi: 'sv2',
      id: '',
      ad: '',
      soyad: '',
      sicilno: '',
      personelno: '',
      firma: '',
      bolum: '',
      pozisyon: '',
      gorev: '',
      altfirma: '',
      yaka: '',
      direktorluk: '',
      sicilgroup: '',
      cardid: '',
      userdef: '',
      aktif: 1, // sadece aktif siciller, 0 yaparsan pasiflerle beraber tüm liste gelir
      okod1: '',
      okod2: '',
      okod3: '',
      okod4: '',
      okod5: '',
      okod6: '',
      okod7: '',
      yetki: -1,
    });

    const payload = { param: this.prepareService.prepare(paramString) };
    const headers = this.buildAuthHeaders();

    return this.http.post<Person[]>(apiUrl, payload, { headers });
  }

  /**
   * Yeni sicil (öğrenci / öğretmen / veli) ekler.
   * Hangi component'ten çağrıldığı fark etmez; ayrımı `personData.userdef` yapar
   * (11: öğrenci, 12: öğretmen, 13: veli).
   *
   * NOT: Backend'in gerçekte beklediği TÜM alanlar (çalışan legacy arayüzden
   * yakalanan network logu baz alınarak) burada dolduruluyor. Formdan gelmeyen
   * alanlar için backend'in kabul ettiği varsayılan değerler kullanılıyor.
   * okod17-okod20 için "undefined" string'i legacy sistemde de aynen
   * gönderiliyor (muhtemelen eski koddaki bir kusur) — backend bunu kabul
   * ettiği için biz de birebir koruyoruz.
   */
  insertPerson(personData: PersonInsertRequest): Observable<any> {
    const apiUrl = `${this.config.apiUrl}/Person`;

    if (!personData || personData.userdef == null) {
      throw new Error('userdef zorunludur (11: Öğrenci, 12: Öğretmen, 13: Veli).');
    }

    const paramString = this.buildParamString({
      islemtipi: 'i',
      id: 0,
      ad: personData.ad || '',
      soyad: personData.soyad || '',
      sicilno: personData.sicilno || '',
      personelno: personData.personelno || '',
      firma: personData.firma || '',
      bolum: personData.bolum || '',
      pozisyon: personData.pozisyon || '',
      gorev: personData.gorev || '',
      altfirma: personData.altfirma || '',
      yaka: personData.yaka || '',
      direktorluk: personData.direktorluk || '',
      kangrubu: personData.kangrubu || '',
      cinsiyet: personData.cinsiyet || '',
      maastipi: '',
      adres: personData.adres || ' ',
      il: personData.il || '',
      ilce: personData.ilce || '',
      email: personData.email || '',
      dogumtarih: personData.dogumtarih || '',
      giristarih: personData.giristarih || '',
      telefon1: personData.telefon1 || '',
      ceptelefon: personData.ceptelefon || '',
      okod1: '',
      okod2: '',
      okod3: '',
      okod4: '',
      okod5: '',
      okod6: '',
      okod7: '',
      okod8: '',
      okod9: '',
      okod10: '',
      okod11: '',
      okod12: '',
      okod13: '',
      okod14: '',
      okod15: '',
      okod16: '',
      okod17: 'undefined',
      okod18: 'undefined',
      okod19: 'undefined',
      okod20: 'undefined',
      cardid: personData.cardid || '',
      cardid26: '',
      facilitycode: '',
      master: '',
      bypasscard: '',
      puantaj: '',
      userdef: personData.userdef,
      fazlamesai: 0,
      eksikmesai: 0,
      erkenmesai: 0,
      eksikgun: 0,
      gecezammi: 0,
      eksikfm: 0,
      eksikfmas: 0,
    });

    const currentUser = this.authService.currentUserValue;
    console.log('🔍 [insertPerson] islemno (SC):', currentUser?.islemno);
    console.log('🔍 [insertPerson] raw paramString:', paramString);

    const encryptedParam = this.prepareService.prepare(paramString);

    const payload = {
      Param: encryptedParam,
      FotoImage: personData.fotoImage
        ? JSON.stringify([{ fotoimage: personData.fotoImage }])
        : JSON.stringify([{ fotoimage: null }]),
    };

    const headers = this.buildAuthHeaders();

    // Log the exact request body for comparison with AngelWeb
    console.log('🔍 [insertPerson] payload:', JSON.stringify(payload));

    return this.http.post<any>(apiUrl, payload, { headers });
  }

  /**
   * Mevcut bir sicil kaydını günceller.
   * insertPerson ile aynı payload yapısını kullanır; fark olarak
   * `islemtipi: 'u'` ve gerçek `id` gönderilir.
   */
  updatePerson(personData: PersonInsertRequest & { id: number }): Observable<any> {
    const apiUrl = `${this.config.apiUrl}/Person`;

    if (!personData || personData.userdef == null) {
      throw new Error('userdef zorunludur (11: Öğrenci, 12: Öğretmen, 13: Veli).');
    }

    const paramString = this.buildParamString({
      islemtipi: 'u',
      id: personData.id,
      ad: personData.ad || '',
      soyad: personData.soyad || '',
      sicilno: personData.sicilno || '',
      personelno: personData.personelno || '',
      firma: personData.firma || '',
      bolum: personData.bolum || '',
      pozisyon: personData.pozisyon || '',
      gorev: personData.gorev || '',
      altfirma: personData.altfirma || '',
      yaka: personData.yaka || '',
      direktorluk: personData.direktorluk || '',
      kangrubu: personData.kangrubu || '',
      cinsiyet: personData.cinsiyet || '',
      maastipi: '',
      adres: personData.adres || ' ',
      il: personData.il || '',
      ilce: personData.ilce || '',
      email: personData.email || '',
      dogumtarih: personData.dogumtarih || '',
      giristarih: personData.giristarih || '',
      telefon1: personData.telefon1 || '',
      ceptelefon: personData.ceptelefon || '',
      okod1: '',
      okod2: '',
      okod3: '',
      okod4: '',
      okod5: '',
      okod6: '',
      okod7: '',
      okod8: '',
      okod9: '',
      okod10: '',
      okod11: '',
      okod12: '',
      okod13: '',
      okod14: '',
      okod15: '',
      okod16: '',
      okod17: 'undefined',
      okod18: 'undefined',
      okod19: 'undefined',
      okod20: 'undefined',
      cardid: personData.cardid || '',
      cardid26: '',
      facilitycode: '',
      master: '',
      bypasscard: '',
      puantaj: '',
      userdef: personData.userdef,
      fazlamesai: 0,
      eksikmesai: 0,
      erkenmesai: 0,
      eksikgun: 0,
      gecezammi: 0,
      eksikfm: 0,
      eksikfmas: 0,
    });

    //AngelWeb karşılaştırması için şifrelenmemiş param'ı logla
    console.log('🔍 [updatePerson] RAW paramString:', paramString);

    const encryptedParam = this.prepareService.prepare(paramString);

    const payload = {
      Param: encryptedParam,
      FotoImage: personData.fotoImage
        ? JSON.stringify([{ fotoimage: personData.fotoImage }])
        : JSON.stringify([{ fotoimage: null }]),
    };

    const headers = this.buildAuthHeaders();

    console.log('🔍 [updatePerson] payload:', JSON.stringify(payload));

    return this.http.post<any>(apiUrl, payload, { headers });
  }

  /**
   * Güncelle + Onayla: AngelWeb'deki iki aşamalı update flow'unu takip eder.
   * 1. POST /Person (islemtipi: 'u') — veriyi kaydeder
   * 2. GET /Dynamic (point=SicilIslem, islemtipi=u) — kaydı aktifleştirir
   *
   * AngelWeb'de "Kaydet" butonuna basıldığında aynı iki istek atılıyor:
   *   POST /Person → ardından GET /Dynamic?Name=SCI!...
   * Dynamic olmadan veri geçici olarak kaydedilir ama aktifleşmez.
   */
  updateAndConfirm(personData: PersonInsertRequest & { id: number }): Observable<any> {
    return this.updatePerson(personData).pipe(
      switchMap(() => {
        const sicilno = personData.sicilno || '';
        const dynamicParam = this.buildParamString({
          point: 'SicilIslem',
          islemtipi: 'u',
          Deger: sicilno,
        });
        const encryptedDynamic = this.prepareService.prepare(dynamicParam);
        const dynamicUrl = `${this.config.apiUrl}/Dynamic?Name=${encodeURIComponent(encryptedDynamic)}`;
        const headers = this.buildAuthHeaders();

        console.log('🔍 [updateAndConfirm] Dynamic URL:', dynamicUrl);

        return this.http.get<any>(dynamicUrl, { headers });
      }),
    );
  }

  terminatePerson(sicilIds: number[], nedenId: number, cikisTarihi: string): Observable<any> {
    // Backend'in beklediği format: Tek ID ise "148", çoklu ise "148#149#150"
    const sicilIdString = sicilIds.join('#');

    const paramString = this.buildParamString({
      islemtipi: 'c',
      point: 'sicil',
      sicilid: sicilIdString,
      neden: nedenId,
      cikistarih: cikisTarihi,
      type: 'cikis',
    });

    console.log('🔍 [terminatePerson] RAW paramString:', paramString);

    // Şifreleme işlemi
    const encryptedParam = this.prepareService.prepare(paramString);

    // HTTP GET isteği için URL'in oluşturulması
    const apiUrl = `${this.config.apiUrl}/Dynamic?Name=${encodeURIComponent(encryptedParam)}`;
    const headers = this.buildAuthHeaders();

    return this.http.get<any>(apiUrl, { headers });
  }

  restorePerson(sicilId: number, girisTarihi: string): Observable<any> {
    const paramString = this.buildParamString({
      islemtipi: 'c',
      point: 'sicil',
      sicilid: sicilId,
      neden: 0,
      cikistarih: girisTarihi,
      type: 'donus',
    });

    console.log('🔍 [restorePerson] RAW paramString:', paramString);

    const encryptedParam = this.prepareService.prepare(paramString);
    const apiUrl = `${this.config.apiUrl}/Dynamic?Name=${encodeURIComponent(encryptedParam)}`;
    const headers = this.buildAuthHeaders();

    return this.http.get<any>(apiUrl, { headers });
  }

  getAyrilisNedenleri(): Observable<any[]> {
    const paramString = this.buildParamString({
      kaynak: 'access',
      point: 'gridcbo',
      islemtipi: 's',
      id: 0,
    });

    const encryptedParam = this.prepareService.prepare(paramString);
    const apiUrl = `${this.config.apiUrl}/Dynamic?Name=${encodeURIComponent(encryptedParam)}`;
    const headers = this.buildAuthHeaders();

    return new Observable<any[]>((observer) => {
      this.http.get<any>(apiUrl, { headers }).subscribe({
        next: (data: any) => {
          console.log('🔍 [getAyrilisNedenleri] RAW response items:', data.length);
          observer.next(data);
          observer.complete();
        },
        error: (err) => observer.error(err),
      });
    });
  }
}

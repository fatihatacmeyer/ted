import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, switchMap } from 'rxjs';
import { APP_CONFIG, AppConfig } from './app-config.service';
import { HelperService } from './helper.service';
import { Person, PersonInsertRequest, ExitReason, extractLinkedPersonIds, buildLinkedPersonelno } from '../core/person.model';
import { AuthService } from './auth.service';
import { PrepareService } from './prepare.service';

@Injectable({
  providedIn: 'root',
})
export class PersonService {
  private http = inject(HttpClient);
  private config: AppConfig = inject(APP_CONFIG);
  private helper = inject(HelperService);
  private authService = inject(AuthService);
  private prepareService = inject(PrepareService);

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
  insertPerson(personData: PersonInsertRequest): Observable<unknown> {
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
      okod1: personData.okod1 || '',
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
    console.log('🔍 [insertPerson] payload:', JSON.stringify(payload));

    return this.http.post<unknown>(apiUrl, payload, { headers });
  }

  /**
   * Mevcut bir sicil kaydını günceller.
   * insertPerson ile aynı payload yapısını kullanır; fark olarak
   * `islemtipi: 'u'` ve gerçek `id` gönderilir.
   */
  updatePerson(personData: PersonInsertRequest & { id: number }): Observable<unknown> {
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
      okod1: personData.okod1 || '',
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

    return this.http.post<unknown>(apiUrl, payload, { headers });
  }

  /**
   * Bidirectional parent-child sync: When a person's linked persons change,
   * add/remove that personId from the target's personelno field.
   * Fire-and-forget — errors logged, never blocks the user.
   */
  updatePersonLinks(personId: number, newLinkedIds: number[], allPersons: Person[]): void {
    for (const target of allPersons) {
      if (target.id === personId) continue;

      const currentIds = extractLinkedPersonIds(target.personelno);
      const hasLink = currentIds.includes(personId);
      const shouldHaveLink = newLinkedIds.includes(target.id);

      if (shouldHaveLink && !hasLink) {
        // Add personId to target's first empty linked-person slot
        const updated = [...currentIds, personId];
        this.updateLinkedPerson(target, updated);
      } else if (!shouldHaveLink && hasLink) {
        // Remove personId from target's linked-person slots
        const updated = currentIds.filter(id => id !== personId);
        this.updateLinkedPerson(target, updated);
      }
    }
  }

  private updateLinkedPerson(person: Person, linkedIds: number[]): void {
    const payload: PersonInsertRequest & { id: number } = {
      id: person.id,
      ad: person.ad || '',
      soyad: person.soyad || '',
      firma: person.firma || '',
      bolum: person.bolum || '',
      pozisyon: person.pozisyon || '',
      gorev: person.gorev || '',
      altfirma: person.altfirma || '',
      yaka: person.yaka || '',
      direktorluk: person.direktorluk || '',
      sicilno: person.sicilno || '',
      personelno: person.personelno || '',
      cardid: person.cardid || '',
      adres: ' ',
      ceptelefon: person.ceptelefon || '',
      userdef: person.userdef,
    };

    // Write linked IDs into personelno with P: prefix
    payload.personelno = buildLinkedPersonelno(linkedIds);

    this.updatePerson(payload).subscribe({
      error: (err) => console.error('[updatePersonLinks] Sync error for person', person.id, err),
    });
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
  updateAndConfirm(personData: PersonInsertRequest & { id: number }): Observable<unknown> {
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

        return this.http.get<unknown>(dynamicUrl, { headers });
      }),
    );
  }

  terminatePerson(sicilIds: number[], nedenId: number, cikisTarihi: string): Observable<unknown> {
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

    const encryptedParam = this.prepareService.prepare(paramString);

    const apiUrl = `${this.config.apiUrl}/Dynamic?Name=${encodeURIComponent(encryptedParam)}`;
    const headers = this.buildAuthHeaders();

    return this.http.get<unknown>(apiUrl, { headers });
  }

  restorePerson(sicilId: number, girisTarihi: string): Observable<unknown> {
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

    return this.http.get<unknown>(apiUrl, { headers });
  }

  getExitReasons(): Observable<ExitReason[]> {
    const paramString = this.buildParamString({
      kaynak: 'access',
      point: 'gridcbo',
      islemtipi: 's',
      id: 0,
    });

    const encryptedParam = this.prepareService.prepare(paramString);
    const apiUrl = `${this.config.apiUrl}/Dynamic?Name=${encodeURIComponent(encryptedParam)}`;
    const headers = this.buildAuthHeaders();

    return new Observable<ExitReason[]>((observer) => {
      this.http.get<unknown>(apiUrl, { headers }).subscribe({
        next: (data) => {
          const items = (Array.isArray(data) ? data : []) as ExitReason[];
          console.log('🔍 [getExitReasons] RAW response items:', items.length);
          observer.next(items);
          observer.complete();
        },
        error: (err) => observer.error(err),
      });
    });
  }
}

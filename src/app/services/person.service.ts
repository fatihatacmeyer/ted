import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
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
      aktif: 1,
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
      firma: '',
      bolum: '',
      pozisyon: '',
      gorev: '',
      altfirma: '',
      yaka: '',
      direktorluk: '',
      kangrubu: '',
      cinsiyet: '',
      maastipi: '',
      adres: ' ',
      il: '',
      ilce: '',
      email: '',
      dogumtarih: '',
      giristarih: '',
      telefon1: '',
      ceptelefon: '',
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
      cardid: '',
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
      FotoImage: JSON.stringify([{ fotoimage: null }]),
    };

    const headers = this.buildAuthHeaders();

    // Log the exact request body for comparison with AngelWeb
    console.log('🔍 [insertPerson] payload:', JSON.stringify(payload));

    return this.http.post<any>(apiUrl, payload, { headers });
  }
}

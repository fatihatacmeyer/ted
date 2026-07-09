import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APP_CONFIG, AppConfig } from './app-config.service';
import { HelperService } from './helper.service';
import { Person } from '../core/person.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class PersonService {
  constructor(
    private http: HttpClient,
    @Inject(APP_CONFIG) private config: AppConfig,
    private helper: HelperService,
    private authService: AuthService,
  ) {}

  getPersonList(): Observable<Person[]> {
    const apiUrl = `${this.config.apiUrl}/PersonList`;

    const paramString =
      'islemtipi=sv2' +
      '&id=' +
      '&ad=' +
      '&soyad=' +
      '&sicilno=' +
      '&personelno=' +
      '&firma=' +
      '&bolum=' +
      '&pozisyon=' +
      '&gorev=' +
      '&altfirma=' +
      '&yaka=' +
      '&direktorluk=' +
      '&sicilgroup=' +
      '&cardid=' +
      '&userdef=' +
      '&aktif=1' +
      '&okod1=' +
      '&okod2=' +
      '&okod3=' +
      '&okod4=' +
      '&okod5=' +
      '&okod6=' +
      '&okod7=' +
      '&yetki=-1';

    const payload = {
      param: paramString,
    };

    const currentUser = this.authService.currentUserValue;

    let userToken = '';
    if (currentUser && currentUser.tokenid) {
      userToken = currentUser.tokenid;
    }

    const headers = new HttpHeaders({
      Authorization: userToken,
    });

    return this.http.post<Person[]>(apiUrl, payload, { headers });
  }
}

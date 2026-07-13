import { Injectable } from '@angular/core';
import { User } from '../core/person.model';

@Injectable({
  providedIn: 'root',
})
export class HelperService {
  userLoginModel: Partial<User> = {
    customerCode: '',
    fullname: '',
    username: '',
    loginname: '',
    gorev: null,
    yetki: null,
    bolum: null,
    kademe: null,
    xsicilid: null,
    extloginname: '',
    customerName: '',
    id: null,
    tokenid: '',
    islemno: '',
    access: '',
    accessmenu: true,
    admin: false,
    islemsonuc: '',
  };
}

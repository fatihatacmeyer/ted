import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Person } from '../../core/person.model';
import { TableModule } from 'primeng/table';
import { MultiSelectModule } from 'primeng/multiselect';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TooltipModule } from 'primeng/tooltip';

export interface ColumnDef {
  field: string;
  header: string;
  sortable?: boolean;
  filterable?: boolean;
}

@Component({
  selector: 'app-person-table',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    MultiSelectModule,
    FormsModule,
    InputTextModule,
    FloatLabelModule,
    IconFieldModule,
    InputIconModule,
    TooltipModule,
  ],
  templateUrl: './person-table.html',
  styleUrl: './person-table.scss',
})
export class PersonTableComponent {
  @Input() persons: Person[] = [];
  @Input() title: string = '';
  @Input() loading: boolean = false;

  allColumns: ColumnDef[] = [
    { field: 'ad', header: 'Ad', sortable: true, filterable: true },
    { field: 'soyad', header: 'Soyad', sortable: true, filterable: true },
    { field: 'sicilno', header: 'Sicil No', sortable: true, filterable: true },
    { field: 'firmaad', header: 'Firma', sortable: true },
    { field: 'bolumad', header: 'Bölüm', sortable: true },
    { field: 'pozisyonad', header: 'Pozisyon', sortable: true },
    { field: 'ceptelefon', header: 'Telefon' },
    { field: 'id', header: 'ID', sortable: true },
    { field: 'personelno', header: 'Personel No', sortable: true },
    { field: 'userid', header: 'User ID' },
    { field: 'altfirmaad', header: 'Alt Firma' },
    { field: 'direktorlukad', header: 'Direktörlük' },
    { field: 'gorevad', header: 'Görev' },
    { field: 'yakaad', header: 'Yaka' },
    { field: 'credit', header: 'Kredi' },
    { field: 'indirimorani', header: 'İndirim Oranı' },
    { field: 'mesaiperiyodu', header: 'Mesai Periyodu' },
    { field: 'mesaiperiyoduad', header: 'Mesai Periyodu Adı' },
    { field: 'cikistarih', header: 'Çıkış Tarihi' },
    { field: 'lyetki', header: 'L Yetki' },
    { field: 'lkademe', header: 'L Kademe' },
    { field: 'userdef', header: 'User Def' },
    { field: 'userdefad', header: 'User Def Adı' },
    { field: 'cardid', header: 'Kart ID' },
    { field: 'yetkistr', header: 'Yetki Str' },
    { field: 'yetkistrad', header: 'Yetki Str Adı' },
  ];

  private readonly defaultFields = [
    'ad', 'soyad', 'sicilno', 'firmaad', 'bolumad', 'pozisyonad', 'ceptelefon',
  ];

  selectedColumnFields: string[] = [...this.defaultFields];

  filterText = '';

  get globalFilterFields(): string[] {
    return this.allColumns.map(col => col.field);
  }

  getVisibleColumns(): ColumnDef[] {
    return this.allColumns.filter(col => this.selectedColumnFields.includes(col.field));
  }

  getFieldValue(person: Person, field: string): any {
    return (person as Record<string, any>)[field];
  }
}

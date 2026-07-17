import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Person, resolveLinkedNames, extractLinkedPersonIds, extractLinkedTeacherIds } from '../../core/person.model';
import { TableModule } from 'primeng/table';
import { MultiSelectModule } from 'primeng/multiselect';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TooltipModule } from 'primeng/tooltip';
import { ButtonModule } from 'primeng/button';

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
    ButtonModule,
  ],
  templateUrl: './person-table.html',
  styleUrl: './person-table.scss',
})
export class PersonTableComponent implements OnInit {
  @Input() persons: Person[] = [];
  @Input() title = '';
  @Input() loading = false;
  @Input() tableId = 'default';
  @Input() columnOverrides: { field: string; header: string }[] = [];
  @Input() allPersons: Person[] = [];
  @Output() rowClick = new EventEmitter<Person>();
  @Output() terminateRequest = new EventEmitter<Person>();
  @Output() restoreRequest = new EventEmitter<Person>();

  allColumns: ColumnDef[] = [
    { field: 'ad', header: 'Ad', sortable: true, filterable: true },
    { field: 'soyad', header: 'Soyad', sortable: true, filterable: true },
    { field: 'sicilno', header: 'Sicil No', sortable: true, filterable: true },
    //{ field: 'firma', header: 'Firma', sortable: true },
    { field: 'firmaad', header: 'Firma', sortable: true },
    { field: 'bolumad', header: 'Bölüm', sortable: true },
    { field: 'pozisyonad', header: 'Pozisyon', sortable: true },
    { field: 'ceptelefon', header: 'Telefon' },
    { field: 'id', header: 'ID', sortable: true },
    { field: 'personelno', header: 'Personel No', sortable: true },
    { field: 'linkedTeachers', header: 'Öğretmenler', sortable: false },
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

  /** Her zaman görünür olan sütunlar — kaldırılamaz */
  private readonly alwaysVisible = ['ad', 'soyad'];

  private readonly defaultFields = [
    'ad',
    'soyad',
    'sicilno',
    //'firma',
    'firmaad',
    'personelno',
    'bolumad',
    'pozisyonad',
    'ceptelefon',
  ];

  selectedColumnFields: string[] = [];

  filterText = '';

  private get storageKey(): string {
    return `ted_table_columns_${this.tableId}`;
  }

  ngOnInit(): void {
    this.selectedColumnFields = this.loadFromStorage();
    this.applyColumnOverrides();
  }

  get globalFilterFields(): string[] {
    return this.allColumns.map((col) => col.field);
  }

  getVisibleColumns(): ColumnDef[] {
    return this.allColumns.filter((col) => this.selectedColumnFields.includes(col.field));
  }

  getFieldValue(person: Person, field: string): string | number | boolean | null {
    return (person as unknown as Record<string, string | number | boolean | null>)[field] ?? null;
  }

  getLinkedDisplay(person: Person): string {
    const ids = extractLinkedPersonIds(person.personelno);
    if (ids.length === 0) return '-';
    if (!this.allPersons.length) return '-';
    const linked = resolveLinkedNames(ids, this.allPersons);
    return linked.map((l) => l.name).join(', ');
  }

  getTeacherLinkedDisplay(person: Person): string {
    const ids = extractLinkedTeacherIds(person.personelno);
    if (ids.length === 0) return '-';
    if (!this.allPersons.length) return '-';
    const linked = resolveLinkedNames(ids, this.allPersons);
    return linked.map((l) => l.name).join(', ');
  }

  private applyColumnOverrides(): void {
    for (const override of this.columnOverrides) {
      const col = this.allColumns.find((c) => c.field === override.field);
      if (col) {
        col.header = override.header;
      }
    }
  }

  /** Multiselect değiştiğinde çağrılır — her zaman görünür sütunları korur + localStorage'a kaydeder */
  onColumnsChanged(): void {
    // Her zaman görünür sütunları zorla ekle
    for (const field of this.alwaysVisible) {
      if (!this.selectedColumnFields.includes(field)) {
        this.selectedColumnFields.push(field);
      }
    }
    this.saveToStorage();
  }

  /** X tuşuna basıldığında — varsayılan sütunlara dön */
  onClearColumns(): void {
    this.selectedColumnFields = [...this.defaultFields];
    this.saveToStorage();
  }

  private loadFromStorage(): string[] {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        const parsed: string[] = JSON.parse(raw);
        // Depolanan değerler hâlâ allColumns'ta var mı filtrele
        const validFields = this.allColumns.map((c) => c.field);
        const filtered = parsed.filter((f) => validFields.includes(f));
        // Yeni default alanları Depolanan listeye ekle
        for (const field of this.defaultFields) {
          if (!filtered.includes(field) && validFields.includes(field)) {
            filtered.push(field);
          }
        }
        for (const field of this.alwaysVisible) {
          if (!filtered.includes(field)) filtered.push(field);
        }
        return filtered;
      }
    } catch {
      /* localStorage bozuksa default'a dön */
    }
    return [...this.defaultFields];
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.selectedColumnFields));
    } catch {
      /* localStorage doluysa sessizce geç */
    }
  }
}

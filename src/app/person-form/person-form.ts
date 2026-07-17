import { Component, EventEmitter, Input, Output, SimpleChanges, OnChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';
import { MultiSelectModule } from 'primeng/multiselect';
import { PersonService } from '../services/person.service';
import { Person, OperationResultResponse, extractLinkedPersonIds, buildLinkedPersonelno } from '../core/person.model';

@Component({
  selector: 'app-person-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogModule,
    InputTextModule,
    TextareaModule,
    ButtonModule,
    DatePickerModule,
    SelectModule,
    TooltipModule,
    MultiSelectModule,
  ],
  templateUrl: './person-form.html',
  styleUrl: './person-form.scss',
})
export class PersonFormComponent implements OnChanges {
  @Input() visible = false;
  @Input({ required: true }) userdef!: number;
  @Input() title = 'Yeni Kayıt Ekle';
  @Input() editPerson: Person | null = null;
  @Input() allPersons: Person[] = [];
  @Input() linkedPersonIds: number[] = [];

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<unknown>();

  /** Düzenleme modunda mı? NguyenChanges tarafından ayarlanır. */
  isEditMode = false;

  private fb = inject(FormBuilder);
  private personService = inject(PersonService);

  form: FormGroup = this.fb.group({
    // Kişisel
    ad: ['', Validators.required],
    soyad: ['', Validators.required],
    dogumtarih: [null as Date | null],
    cinsiyet: [null],
    kangrubu: [null],
    // Kimlik
    sicilno: [''],
    personelno: [''],
    cardid: [''],
    // İletişim
    ceptelefon: [''],
    telefon1: [''],
    email: [''],
    // Adres
    adres: [''],
    il: [''],
    ilce: [''],
    // Kurumsal
    firma: [''],
    bolum: [''],
    pozisyon: [''],
    gorev: [''],
    altfirma: [''],
    direktorluk: [''],
    yaka: [''],
    giristarih: [null as Date | null],
    linkedPersons: [[] as number[]],
  });
  isSaving = false;
  errorMessage = '';
  selectedPhoto: string | null = null;
  photoFileName = '';

  readonly genderOptions = [
    { label: 'Erkek', value: 'E' },
    { label: 'Kadın', value: 'K' },
  ];

  readonly bloodTypeOptions = [
    { label: 'A+', value: 'A+' },
    { label: 'A-', value: 'A-' },
    { label: 'B+', value: 'B+' },
    { label: 'B-', value: 'B-' },
    { label: 'AB+', value: 'AB+' },
    { label: 'AB-', value: 'AB-' },
    { label: 'O+', value: 'O+' },
    { label: 'O-', value: 'O-' },
  ];


  ngOnChanges(changes: SimpleChanges): void {
    if (changes['editPerson']) {
      this.isEditMode = this.editPerson !== null;
      if (this.editPerson) {
        this.patchFormForEdit();
      }
    }
  }

  /** Düzenleme modunda form alanlarını mevcut person verisiyle doldurur. */
  private patchFormForEdit(): void {
    const p = this.editPerson!;
    this.form.patchValue({
      ad: p.ad || '',
      soyad: p.soyad || '',
      dogumtarih: this.parseDate(p.cikistarih), // sicil modelinde dogumtarih yok; cikistarih'i maps ediyoruz
      cinsiyet: null,
      kangrubu: null,
      sicilno: p.sicilno || '',
      personelno: p.personelno || '',
      cardid: p.cardid || '',
      ceptelefon: p.ceptelefon || '',
      telefon1: '',
      email: '',
      adres: '',
      il: '',
      ilce: '',
      firma: p.firmaad || '',
      bolum: p.bolumad || '',
      pozisyon: p.pozisyonad || '',
      gorev: p.gorevad || '',
      altfirma: p.altfirmaad || '',
      direktorluk: p.direktorlukad || '',
      yaka: p.yakaad || '',
      giristarih: null,
    });
    // linkedPersons'ı personelno alanından oku
    const linkedIds = extractLinkedPersonIds(p.personelno);
    this.form.patchValue({ linkedPersons: linkedIds });
  }

  /** Backend'den gelen 'YYYY-MM-DD' string'ini Date objesine çevirir. */
  private parseDate(dateStr: string | null | undefined): Date | null {
    if (!dateStr) return null;
    const parts = dateStr.split('-');
    if (parts.length !== 3) return null;
    return new Date(+parts[0], +parts[1] - 1, +parts[2]);
  }

  close(): void {
    this.visible = false;
    this.visibleChange.emit(false);
    this.errorMessage = '';
    this.isSaving = false;
    this.isEditMode = false;
    this.selectedPhoto = null;
    this.photoFileName = '';
    this.form.reset();
    this.form.patchValue({ linkedPersons: [] });
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files.length) return;

    const file = input.files[0];
    this.photoFileName = file.name;

    const reader = new FileReader();
    reader.onload = () => {
      this.selectedPhoto = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  removePhoto(): void {
    this.selectedPhoto = null;
    this.photoFileName = '';
  }

  private formatDate(d: Date | null): string {
    if (!d) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  get linkedPersonOptions(): { label: string; value: number }[] {
    // userdef=11 → show userdef=13 (parents), userdef=13 → show userdef=11 (children)
    const targetUserdef = this.userdef === 11 ? 13 : 11;
    return this.allPersons
      .filter(p => p.userdef === targetUserdef)
      .map(p => ({ label: `${p.adsoyad} (${p.sicilno})`, value: p.id }));
  }

  get showLinkedPersons(): boolean {
    return this.userdef === 11 || this.userdef === 13;
  }

  get linkedPersonsLabel(): string {
    return this.userdef === 11 ? 'Veliler' : 'Çocuklar';
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';

    const v = this.form.value;

    const payload = {
      ad: v.ad || '',
      soyad: v.soyad || '',
      dogumtarih: this.formatDate(v.dogumtarih),
      cinsiyet: v.cinsiyet || '',
      kangrubu: v.kangrubu || '',
      sicilno: v.sicilno || '',
      personelno: this.showLinkedPersons ? buildLinkedPersonelno(v.linkedPersons || []) : (v.personelno || ''),
      cardid: v.cardid || '',
      ceptelefon: v.ceptelefon || '',
      telefon1: v.telefon1 || '',
      email: v.email || '',
      adres: v.adres || '',
      il: v.il || '',
      ilce: v.ilce || '',
      // Düzenleme modunda: orijinal Person'dan gelen ID'leri kullan
      // (form text gösterir ama backend ID bekler — AngelWeb de ID gönderir)
      firma: this.isEditMode ? (this.editPerson?.firma ?? '') : (v.firma || ''),
      bolum: this.isEditMode ? (this.editPerson?.bolum ?? '') : (v.bolum || ''),
      pozisyon: this.isEditMode ? (this.editPerson?.pozisyon ?? '') : (v.pozisyon || ''),
      gorev: this.isEditMode ? (this.editPerson?.gorev ?? '') : (v.gorev || ''),
      altfirma: this.isEditMode ? (this.editPerson?.altfirma ?? '') : (v.altfirma || ''),
      direktorluk: this.isEditMode ? (this.editPerson?.direktorluk ?? '') : (v.direktorluk || ''),
      yaka: this.isEditMode ? (this.editPerson?.yaka ?? '') : (v.yaka || ''),
      giristarih: this.formatDate(v.giristarih),
      userdef: this.userdef,
      fotoImage: this.selectedPhoto,
    };

    if (this.isEditMode) {
      // UPDATE: Tek aşamalı — POST /Person (AngelWeb'de de Dynamic GET yok)
      this.personService.updatePerson({ ...payload, id: this.editPerson!.id }).subscribe({
        next: (response: unknown) => {
          this.isSaving = false;

          // Backend [] dönerse — muhtemelen parametre sorunu
          if (Array.isArray(response) && response.length === 0) {
            this.errorMessage = 'Kayıt güncellenemedi. Sunucu boş yanıt döndü.';
            return;
          }

          const result = (Array.isArray(response) ? response[0] : response) as OperationResultResponse;

          if (result && (result.islemsonuc == '1' || result.islemsonuc == 1)) {
            this.saved.emit(response);
            this.close();
          } else {
            const islemno = result?.islemno || 'bilinmiyor';
            const islemsonuc = result?.islemsonuc ?? 'bilinmiyor';
            this.errorMessage = `Kayıt güncellenemedi. (islemsonuc=${islemsonuc}, islemno=${islemno})`;
          }
        },
        error: (err: unknown) => {
          this.isSaving = false;
          console.error('Person update error:', err);
          this.errorMessage = 'Sunucu hatası: Kayıt güncellenemedi.';
        },
      });
    } else {
      // INSERT: Tek aşamalı — POST /Person
      this.personService.insertPerson(payload).subscribe({
        next: (response: unknown) => {
          this.isSaving = false;

          const result = (Array.isArray(response) ? response[0] : response) as OperationResultResponse;

          if (result && (result.islemsonuc == '1' || result.islemsonuc == 1)) {
            this.saved.emit(response);
            this.close();
          } else {
            this.errorMessage =
              (result && result.sunucucevap) ||
              'Kayıt başarısız oldu. Lütfen tekrar deneyin.';
          }
        },
        error: (err: unknown) => {
          this.isSaving = false;
          console.error('Person insert error:', err);
          this.errorMessage = 'Sunucu hatası: Kayıt oluşturulamadı.';
        },
      });
    }
  }
}

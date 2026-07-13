import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';
import { PersonService } from '../services/person.service';
import { Person } from '../core/person.model';

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
  ],
  templateUrl: './person-form.html',
  styleUrl: './person-form.scss',
})
export class PersonFormComponent {
  @Input() visible = false;
  @Input({ required: true }) userdef!: number;
  @Input() title = 'Yeni Kayıt Ekle';
  @Input() editPerson: Person | null = null;

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<void>();

  /** Düzenleme modunda mı? NguyenChanges tarafından ayarlanır. */
  isEditMode = false;

  form: FormGroup;
  isSaving = false;
  errorMessage = '';
  selectedPhoto: string | null = null;
  photoFileName = '';

  readonly cinsiyetOptions = [
    { label: 'Erkek', value: 'E' },
    { label: 'Kadın', value: 'K' },
  ];

  readonly kangrubuOptions = [
    { label: 'A+', value: 'A+' },
    { label: 'A-', value: 'A-' },
    { label: 'B+', value: 'B+' },
    { label: 'B-', value: 'B-' },
    { label: 'AB+', value: 'AB+' },
    { label: 'AB-', value: 'AB-' },
    { label: 'O+', value: 'O+' },
    { label: 'O-', value: 'O-' },
  ];

  constructor(
    private fb: FormBuilder,
    private personService: PersonService,
  ) {
    this.form = this.fb.group({
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
    });
  }

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
      personelno: v.personelno || '',
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

    console.log('🔍 [submit] isEditMode:', this.isEditMode, '| id:', this.editPerson?.id);
    if (this.isEditMode) {
      console.log('🔍 [submit] reference IDs:', JSON.stringify({
        firma: payload.firma,
        bolum: payload.bolum,
        pozisyon: payload.pozisyon,
        gorev: payload.gorev,
      }));
    }

    if (this.isEditMode) {
      // UPDATE: Tek aşamalı — POST /Person (AngelWeb'de de Dynamic GET yok)
      this.personService.updatePerson({ ...payload, id: this.editPerson!.id }).subscribe({
        next: (response: any) => {
          this.isSaving = false;
          console.log('🔍 [submit update] response:', JSON.stringify(response));

          // Backend [] dönerse — muhtemelen parametre sorunu
          if (Array.isArray(response) && response.length === 0) {
            console.error('❌ [submit update] Backend boş dizi [] döndü — parametre sorunu olabilir');
            this.errorMessage = 'Kayıt güncellenemedi. Sunucu boş yanıt döndü. Konsoldaki RAW parametrilere bakın.';
            return;
          }

          const result = Array.isArray(response) ? response[0] : response;

          if (result && (result.islemsonuc == '1' || result.islemsonuc == 1)) {
            this.saved.emit();
            this.close();
          } else {
            const islemno = result?.islemno || 'bilinmiyor';
            const islemsonuc = result?.islemsonuc ?? 'bilinmiyor';
            console.error(`❌ [submit update] islemsonuc=${islemsonuc} | islemno=${islemno}`);
            this.errorMessage = `Kayıt güncellenemedi. (islemsonuc=${islemsonuc}, islemno=${islemno})`;
          }
        },
        error: (err: any) => {
          this.isSaving = false;
          console.error('Person update error:', err);
          this.errorMessage = 'Sunucu hatası: Kayıt güncellenemedi.';
        },
      });
    } else {
      // INSERT: Tek aşamalı — POST /Person
      this.personService.insertPerson(payload).subscribe({
        next: (response: any) => {
          this.isSaving = false;
          console.log('🔍 [submit insert] response:', JSON.stringify(response));

          const result = Array.isArray(response) ? response[0] : response;

          if (result && (result.islemsonuc == '1' || result.islemsonuc == 1)) {
            this.saved.emit();
            this.close();
          } else {
            this.errorMessage =
              (result && result.sunucucevap) ||
              'Kayıt başarısız oldu. Lütfen tekrar deneyin.';
          }
        },
        error: (err: any) => {
          this.isSaving = false;
          console.error('Person insert error:', err);
          this.errorMessage = 'Sunucu hatası: Kayıt oluşturulamadı.';
        },
      });
    }
  }
}

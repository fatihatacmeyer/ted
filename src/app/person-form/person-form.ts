import { Component, EventEmitter, Input, Output } from '@angular/core';
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

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<void>();

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

  close(): void {
    this.visible = false;
    this.visibleChange.emit(false);
    this.errorMessage = '';
    this.isSaving = false;
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
      firma: v.firma || '',
      bolum: v.bolum || '',
      pozisyon: v.pozisyon || '',
      gorev: v.gorev || '',
      altfirma: v.altfirma || '',
      direktorluk: v.direktorluk || '',
      yaka: v.yaka || '',
      giristarih: this.formatDate(v.giristarih),
      userdef: this.userdef,
      fotoImage: this.selectedPhoto,
    };

    this.personService.insertPerson(payload).subscribe({
      next: (response: any) => {
        this.isSaving = false;
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

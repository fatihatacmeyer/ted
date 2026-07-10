import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { PersonService } from '../services/person.service';
/**
 * Öğrenci / Öğretmen / Veli ekleme için tek, tekrar kullanılabilir form.
 * Component'ler arasındaki TEK fark `userdef` input'udur:
 *   11 = Öğrenci, 12 = Öğretmen, 13 = Veli
 *
 * Kullanım:
 *   <app-person-form
 *     [(visible)]="showAddDialog"
 *     [userdef]="11"
 *     title="Yeni Öğrenci Ekle"
 *     (saved)="fetchPersonList()"
 *   ></app-person-form>
 */
@Component({
  selector: 'app-person-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DialogModule, InputTextModule, ButtonModule],
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

  constructor(
    private fb: FormBuilder,
    private personService: PersonService,
  ) {
    this.form = this.fb.group({
      ad: ['', Validators.required],
      soyad: ['', Validators.required],
      sicilno: [''],
      personelno: [''],
    });
  }

  close(): void {
    this.visible = false;
    this.visibleChange.emit(false);
    this.errorMessage = '';
    this.isSaving = false;
    this.form.reset();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';

    const payload = {
      ...this.form.value,
      userdef: this.userdef,
    };

    this.personService.insertPerson(payload).subscribe({
      next: (response: any) => {
        this.isSaving = false;
        const result = Array.isArray(response) ? response[0] : response;

        if (result && (result.islemsonuc == '1' || result.islemsonuc == 1)) {
          this.saved.emit();
          this.close();
        } else {
          // Backend cevap verdi ama işlem başarısız oldu.
          // sunucucevap varsa göster, yoksa jenerik mesaj ver.
          this.errorMessage =
            (result && result.sunucucevap) || 'Kayıt eklenemedi. Sunucu işlemi reddetti.';
          console.error('insertPerson: işlem başarısız, sunucu cevabı:', result);
        }
      },
      error: (err: any) => {
        this.isSaving = false;
        // Ağ hatası / 401 / CORS / sunucuya ulaşılamıyor gibi durumlar buraya düşer.
        this.errorMessage = 'Sistem hatası: Sunucuya ulaşılamadı (bkz. konsol).';
        console.error('insertPerson: istek hatası', err);
      },
    });
  }
}

import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { Person, PersonLeaveRequest, LeaveRequestResponse } from '../core/person.model';
import { PersonService } from '../services/person.service';
import { APP_CONFIG, AppConfig } from '../services/app-config.service';

@Component({
  selector: 'app-person-leave-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogModule, ButtonModule, InputTextModule, TextareaModule],
  templateUrl: './person-leave-dialog.html',
  styleUrl: './person-leave-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PersonLeaveDialogComponent implements OnChanges {
  @Input() visible = false;
  @Input() person: Person | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() confirmed = new EventEmitter<void>();

  private personService = inject(PersonService);
  private cdr = inject(ChangeDetectorRef);
  private sanitizer = inject(DomSanitizer);
  private config: AppConfig = inject(APP_CONFIG);

  selectedStartDate: Date | null = null;
  selectedEndDate: Date | null = null;
  leaveAddress = '';
  transport = false;
  meal = false;
  description = '';
  isProcessing = false;
  errorMessage = '';

  // PDF gösterimi için
  pdfVisible = false;
  pdfUrl: SafeResourceUrl | null = null;
  private blobUrl: string | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible) {
      this.errorMessage = '';
      const today = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);
      this.selectedStartDate = today;
      this.selectedEndDate = tomorrow;
      this.leaveAddress = '';
      this.transport = false;
      this.meal = false;
      this.description = '';
      this.isProcessing = false;
    }
  }

  get dialogTitle(): string {
    if (!this.person) return 'İzin Ata';
    return `İzin Ata — ${this.person.ad} ${this.person.soyad}`;
  }

  get isFormValid(): boolean {
    if (!this.selectedStartDate) return false;
    if (!this.selectedEndDate) return false;
    if (!this.leaveAddress.trim()) return false;
    return true;
  }

  private formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  onConfirm(): void {
    if (!this.person || !this.isFormValid) return;

    this.isProcessing = true;
    this.errorMessage = '';

    const request: PersonLeaveRequest = {
      bastarih: this.formatDate(this.selectedStartDate!),
      bittarih: this.formatDate(this.selectedEndDate!),
      siciller: this.person.sicilno ?? '',
      tip: 30,
      islemtipi: 'i',
      izinadresi: this.leaveAddress,
      ulasim: this.transport ? 1 : 0,
      yemek: this.meal ? 1 : 0,
      aciklama: this.description,
      kaynak: 'izin',
      point: 'talep',
    };

    this.personService.requestLeave(request).subscribe({
      next: (response: LeaveRequestResponse[]) => {
        this.isProcessing = false;

        const result = response[0];
        if (!result) {
          this.errorMessage = 'Sunucudan geçerli bir yanıt alınamadı.';
          this.cdr.markForCheck();
          return;
        }

        if (result.sonuc < 0) {
          this.errorMessage = 'Uygun olmayan izin talepleri mevcut. Tarihleri kontrol edin.';
          this.cdr.markForCheck();
          return;
        }

        if (result.sonuc > 0 && result.formid) {
          // PDF formu var — raporu getir ve göster
          this.loadReport(result.formid);
        } else {
          // Başarılı ama PDF yok — doğrudan kapat
          this.confirmed.emit();
          this.close();
        }
        this.cdr.markForCheck();
      },
      error: (err: unknown) => {
        this.isProcessing = false;
        this.errorMessage =
          'Bir hata oluştu: ' + (err instanceof Error ? err.message : 'Bilinmeyen hata');
        this.cdr.markForCheck();
      },
    });
  }

  private loadReport(formid: string): void {
    this.personService.getLeaveReport(formid).subscribe({
      next: (report) => {
        const result = report[0];
        if (result?.link) {
          // Legacy: baglanti.substr(0, baglanti.length - 3) + d.link
          // = "https://meyerapi.local/" + d.link (mutlak URL, proxy'den bağımsız)
          const baseUrl = this.config.reportBaseUrl || '';
          // link'in başında / varsa çift slash olmaması için kaldır
          const link = result.link.startsWith('/') ? result.link : `/${result.link}`;
          const fullUrl = `${baseUrl}${link}`;

          // CSP frame-ancestors sorunu yüzünden PDF'i fetch ile blob olarak al
          // blob URL same-origin sayılır, CSP iframe kısıtlamasını bypass eder
          fetch(fullUrl)
            .then(response => {
              if (!response.ok) throw new Error('PDF fetch failed');
              return response.blob();
            })
            .then(blob => {
              // Önceki blob URL'i temizle
              if (this.blobUrl) URL.revokeObjectURL(this.blobUrl);
              this.blobUrl = URL.createObjectURL(blob);
              this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.blobUrl);
              this.pdfVisible = true;
              this.cdr.markForCheck();
            })
            .catch(() => {
              // CORS hatası varsa yeni sekmede aç
              window.open(fullUrl, '_blank');
              this.confirmed.emit();
              this.close();
              this.cdr.markForCheck();
            });
        } else {
          this.confirmed.emit();
          this.close();
        }
        this.cdr.markForCheck();
      },
      error: () => {
        // PDF getirme başarısızsa bile izin kaydedildi
        this.confirmed.emit();
        this.close();
        this.cdr.markForCheck();
      },
    });
  }

  close(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  onPdfClose(): void {
    this.pdfVisible = false;
    this.pdfUrl = null;
    // Blob URL'i serbest bırak (bellek sızıntısı önlemi)
    if (this.blobUrl) {
      URL.revokeObjectURL(this.blobUrl);
      this.blobUrl = null;
    }
    this.confirmed.emit();
    this.close();
  }
}

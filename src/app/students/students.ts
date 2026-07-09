import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { PersonService } from '../services/person.service';
import { Person } from '../core/person.model';
import { PersonTableComponent } from '../shared/person-table/person-table';

@Component({
  selector: 'app-students',
  standalone: true,
  imports: [PersonTableComponent],
  templateUrl: './students.html',
  styleUrl: './students.scss',
})
export class StudentsComponent implements OnInit {
  persons: Person[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';

  constructor(
    private personService: PersonService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.fetchPersonList();
  }

  fetchPersonList(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.personService.getPersonList().subscribe({
      next: (data: Person[]) => {
        this.persons = data.filter((p) => p.userdef === 11);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Personel listesi yüklenirken hata oluştu:', err);
        this.errorMessage = 'Sistem hatası: Personel listesi sunucudan çekilemedi.';
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  addNewPerson(): void {
    const mockData = {
      ad: 'Ahmet',
      soyad: 'Yılmaz',
      sicilno: 'S-1002',
      userdef: '11',
    };

    try {
      this.personService.insertPerson(mockData).subscribe({
        next: (response: any) => {
          // Eski projedeki "islemsonuc == 1" kontrolü
          if (response && response[0] && response[0].islemsonuc == '1') {
            console.log('Sicil Başarıyla Eklendi');
            this.fetchPersonList(); // Listeyi yenile
          } else {
            this.errorMessage = 'Ekleme başarısız oldu (Sunucu hatası).';
          }
        },
        error: (err: any) => {
          console.error('API isteği sırasında hata oluştu', err);
          this.errorMessage = 'Sistem hatası oluştu.';
        },
      });
    } catch (validationError: any) {
      // Eğer userdef 11 veya 20 dışında bir şey gelirse doğrudan buraya düşecek (API'ye gitmeyecek)
      console.warn(validationError.message);
      this.errorMessage = validationError.message;
      this.cdr.detectChanges();
    }
  }
}

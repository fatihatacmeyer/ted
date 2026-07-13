import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { PersonService } from '../services/person.service';
import { Person } from '../core/person.model';
import { PersonTableComponent } from '../shared/person-table/person-table';
import { PersonFormComponent } from '../person-form/person-form';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
@Component({
  selector: 'app-students',
  standalone: true,
  imports: [PersonTableComponent, PersonFormComponent, ButtonModule, ProgressSpinnerModule],
  templateUrl: './students.html',
  styleUrl: './students.scss',
})
export class StudentsComponent implements OnInit {
  /** Öğrenci sicilleri için sabit userdef değeri. */
  readonly USERDEF = 11;

  persons: Person[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';
  showAddDialog = false;
  editPerson: Person | null = null;

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
        // API'nin döndüğü tüm alanları görelim (firma ID'leri geliyor mu?)
        if (data.length > 0) {
          console.log('🔍 [PersonList] First item RAW fields:', JSON.stringify(Object.keys(data[0])));
          console.log('🔍 [PersonList] First item ALL data:', JSON.stringify(data[0]));
        }
        this.persons = data.filter((p) => p.userdef === this.USERDEF);
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

  openAddDialog(): void {
    this.editPerson = null;
    this.showAddDialog = true;
  }

  onRowClick(person: Person): void {
    this.editPerson = person;
    this.showAddDialog = true;
  }

  onEditDialogClose(): void {
    this.editPerson = null;
  }

  onPersonSaved(): void {
    this.editPerson = null;
    this.fetchPersonList();
  }
}

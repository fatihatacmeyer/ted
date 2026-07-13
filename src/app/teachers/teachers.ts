import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { PersonService } from '../services/person.service';
import { Person } from '../core/person.model';
import { PersonTableComponent } from '../shared/person-table/person-table';
import { PersonFormComponent } from '../person-form/person-form';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
  selector: 'app-teachers',
  standalone: true,
  imports: [PersonTableComponent, PersonFormComponent, ButtonModule, ProgressSpinnerModule],
  templateUrl: './teachers.html',
  styleUrl: './teachers.scss',
})
export class TeachersComponent implements OnInit {
  /** Öğretmen sicilleri için sabit userdef değeri. */
  readonly USERDEF = 12;

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

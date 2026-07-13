import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { PersonService } from '../services/person.service';
import { Person } from '../core/person.model';
import { PersonTableComponent } from '../shared/person-table/person-table';
import { PersonFormComponent } from '../person-form/person-form';
import { PersonExitDialogComponent } from '../person-exit-dialog/person-exit-dialog';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
@Component({
  selector: 'app-parents',
  standalone: true,
  imports: [PersonTableComponent, PersonFormComponent, PersonExitDialogComponent, ButtonModule, ProgressSpinnerModule],
  templateUrl: './parents.html',
  styleUrl: './parents.scss',
})
export class ParentsComponent implements OnInit {
  /** Veli sicilleri için sabit userdef değeri. */
  readonly USERDEF = 13;

  persons: Person[] = [];
  isLoading = false;
  errorMessage = '';
  showAddDialog = false;
  editPerson: Person | null = null;
  showExitDialog = false;
  exitPerson: Person | null = null;
  exitMode: 'exit' | 'restore' = 'exit';

  private personService = inject(PersonService);
  private cdr = inject(ChangeDetectorRef);

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
      error: (err: HttpErrorResponse) => {
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

  onTerminateRequest(person: Person): void {
    this.exitPerson = person;
    this.exitMode = 'exit';
    this.showExitDialog = true;
  }

  onRestoreRequest(person: Person): void {
    this.exitPerson = person;
    this.exitMode = 'restore';
    this.showExitDialog = true;
  }

  onExitDialogClose(): void {
    this.exitPerson = null;
  }

  onExitConfirmed(): void {
    this.exitPerson = null;
    this.fetchPersonList();
  }
}

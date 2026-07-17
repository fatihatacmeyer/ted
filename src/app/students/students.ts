import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { PersonService } from '../services/person.service';
import { Person, extractLinkedPersonIds, extractLinkedTeacherIds } from '../core/person.model';
import { PersonProfileComponent } from '../person-profile/person-profile';
import { PersonTableComponent } from '../shared/person-table/person-table';
import { PersonFormComponent } from '../person-form/person-form';
import { PersonExitDialogComponent } from '../person-exit-dialog/person-exit-dialog';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
@Component({
  selector: 'app-students',
  standalone: true,
  imports: [PersonTableComponent, PersonFormComponent, PersonExitDialogComponent, PersonProfileComponent, ButtonModule, ProgressSpinnerModule],
  templateUrl: './students.html',
  styleUrl: './students.scss',
})
export class StudentsComponent implements OnInit {
  /** Öğrenci sicilleri için sabit userdef değeri. */
  readonly USERDEF = 11;

  persons: Person[] = [];
  isLoading = false;
  errorMessage = '';
  showAddDialog = false;
  editPerson: Person | null = null;
  showExitDialog = false;
  exitPerson: Person | null = null;
  exitMode: 'exit' | 'restore' = 'exit';
  allPersons: Person[] = [];
  showProfileModal = false;
  selectedProfilePerson: Person | null = null;
  studentColumnOverrides = [
    { field: 'personelno', header: 'Veliler' },
    { field: 'linkedTeachers', header: 'Öğretmenler' },
  ];

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
        this.allPersons = data;
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
    this.selectedProfilePerson = person;
    this.showProfileModal = true;
  }

  onEditDialogClose(): void {
    this.editPerson = null;
  }

  onPersonSaved(response: unknown): void {
    const personData = (Array.isArray(response) ? response[0] : response) as Person;

    if (personData && personData.id) {
      // Bidirectional sync: update linked persons (veliler) reference fields
      const newLinkedIds = extractLinkedPersonIds(personData.personelno);
      if (newLinkedIds.length > 0) {
        this.personService.updatePersonLinks(personData.id, newLinkedIds, this.allPersons);
      }
      // Bidirectional sync: update linked teachers reference fields
      const newTeacherIds = extractLinkedTeacherIds(personData.personelno);
      if (newTeacherIds.length > 0) {
        this.personService.updateTeacherLinks(personData.id, newTeacherIds, this.allPersons);
      }
    }

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

  onLinkedPersonClick(person: Person): void {
    this.selectedProfilePerson = person;
  }

  onEditRequest(person: Person): void {
    this.showProfileModal = false;
    this.editPerson = person;
    this.showAddDialog = true;
  }

  getLinkedIds(person: Person): number[] {
    return extractLinkedPersonIds(person.personelno);
  }

  getTeacherLinkedIds(person: Person): number[] {
    return extractLinkedTeacherIds(person.personelno);
  }
}

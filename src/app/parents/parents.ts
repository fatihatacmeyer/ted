import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { PersonService } from '../services/person.service';
import { Person } from '../core/person.model';
import { PersonTableComponent } from '../shared/person-table/person-table';
import { PersonFormComponent } from '../person-form/person-form';
@Component({
  selector: 'app-parents',
  standalone: true,
  imports: [PersonTableComponent, PersonFormComponent],
  templateUrl: './parents.html',
  styleUrl: './parents.scss',
})
export class ParentsComponent implements OnInit {
  /** Veli sicilleri için sabit userdef değeri. */
  readonly USERDEF = 13;

  persons: Person[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';
  showAddDialog = false;

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
    this.showAddDialog = true;
  }

  onPersonSaved(): void {
    this.fetchPersonList();
  }
}

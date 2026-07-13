import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { Person, LinkedPerson, parseLinkedIds, resolveLinkedNames } from '../core/person.model';

@Component({
  selector: 'app-person-profile',
  standalone: true,
  imports: [CommonModule, DialogModule, ButtonModule],
  templateUrl: './person-profile.html',
  styleUrl: './person-profile.scss',
})
export class PersonProfileComponent {
  @Input() visible = false;
  @Input() person: Person | null = null;
  @Input() allPersons: Person[] = [];
  @Input() userdefContext = 11;

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() personClick = new EventEmitter<Person>();
  @Output() editRequest = new EventEmitter<Person>();

  get linkedPersons(): LinkedPerson[] {
    if (!this.person) return [];
    const ids = parseLinkedIds(this.person.firma);
    if (ids.length === 0) return [];
    return resolveLinkedNames(ids, this.allPersons);
  }

  get linkedPersonsLabel(): string {
    if (this.userdefContext === 11) return 'Veliler';
    if (this.userdefContext === 13) return 'Çocuklar';
    return 'Bağlantılı Kişiler';
  }

  get hasLinkedPersons(): boolean {
    return this.linkedPersons.length > 0;
  }

  onLinkedPersonClick(linked: LinkedPerson): void {
    const found = this.allPersons.find(p => p.id === linked.id);
    if (found) {
      this.personClick.emit(found);
    }
  }

  onEditClick(): void {
    if (this.person) {
      this.editRequest.emit(this.person);
    }
  }

  close(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }
}

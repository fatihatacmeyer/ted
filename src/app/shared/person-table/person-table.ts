import { Component, Input } from '@angular/core';
import { Person } from '../../core/person.model';
import { TableModule } from 'primeng/table';
@Component({
  selector: 'app-person-table',
  standalone: true,
  imports: [TableModule],
  templateUrl: './person-table.html',
  styleUrl: './person-table.scss',
})
export class PersonTableComponent {
  @Input() persons: Person[] = [];
}

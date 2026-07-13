import { Component, Input, Output, EventEmitter } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavItem {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class SidebarComponent {
  @Input() isOpen = true;

  @Output() sidebarToggle = new EventEmitter<void>();

  protected readonly navItems: NavItem[] = [
    { label: 'Anasayfa', route: '/home/anasayfa', icon: 'dashboard' },
    { label: 'Öğrenciler', route: '/home/students', icon: 'school' },
    { label: 'Öğretmenler', route: '/home/teachers', icon: 'badge' },
    { label: 'Veliler', route: '/home/parents', icon: 'group' },
    { label: 'Servis', route: '/home/bus', icon: 'directions_bus' },
  ];
}

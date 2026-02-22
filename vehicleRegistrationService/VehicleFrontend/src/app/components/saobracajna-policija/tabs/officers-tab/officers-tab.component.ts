import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrafficPoliceService, Officer } from '../../../../services/traffic-police.service';

@Component({
  selector: 'app-officers-tab',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './officers-tab.component.html'
})
export class OfficersTabComponent implements OnInit {
  private policeService = inject(TrafficPoliceService);

  officers = signal<Officer[]>([]);
  isOfficersLoading = signal(false);

  ngOnInit() {
    this.loadOfficers();
  }

  loadOfficers() {
    this.isOfficersLoading.set(true);
    this.policeService.getOfficers().subscribe({
      next: (data) => { this.officers.set(data); this.isOfficersLoading.set(false); },
      error: () => { this.isOfficersLoading.set(false); }
    });
  }
}

import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TrafficPoliceService, VehicleDossier } from '../../../../services/traffic-police.service';

@Component({
  selector: 'app-check-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule],
  templateUrl: './check-tab.component.html'
})
export class CheckTabComponent {
  private policeService = inject(TrafficPoliceService);

  checkPlate = '';
  dossier = signal<VehicleDossier | null>(null);
  isDossierLoading = signal(false);
  dossierError = signal('');
  dossierSearched = signal(false);

  checkVehicleStatus() {
    const plate = this.checkPlate.trim();
    if (!plate) return;
    this.isDossierLoading.set(true);
    this.dossierError.set('');
    this.dossier.set(null);
    this.dossierSearched.set(true);
    this.policeService.getVehicleStatus(plate).subscribe({
      next: (data) => { this.dossier.set(data); this.isDossierLoading.set(false); },
      error: () => { this.dossierError.set('Грешка при провери. Проверите регистарску ознаку.'); this.isDossierLoading.set(false); }
    });
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('sr-RS', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  violationTypeLabel(type: string): string {
    const m: Record<string, string> = {
      'SPEEDING': 'Брзина', 'PARKING': 'Паркирање', 'DUI': 'Алкохол',
      'RED_LIGHT': 'Семафор', 'EXPIRED_DOCS': 'Документа', 'RECKLESS_DRIVING': 'Нехатна вожња'
    };
    return m[type] ?? type;
  }
}

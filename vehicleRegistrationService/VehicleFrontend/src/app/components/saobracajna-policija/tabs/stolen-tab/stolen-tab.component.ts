import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TrafficPoliceService, StolenVehicle } from '../../../../services/traffic-police.service';

@Component({
  selector: 'app-stolen-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ButtonModule],
  templateUrl: './stolen-tab.component.html'
})
export class StolenTabComponent implements OnInit {
  private policeService = inject(TrafficPoliceService);
  private fb = inject(FormBuilder);

  stolenVehicles = signal<StolenVehicle[]>([]);
  isStolenLoading = signal(false);
  showReportStolenForm = signal(false);
  isReportingStolenLoading = signal(false);
  reportStolenError = signal('');
  reportStolenSuccess = signal('');

  reportStolenForm = this.fb.group({
    vehiclePlate: ['', [Validators.required, Validators.minLength(3)]],
    description:  ['', [Validators.required, Validators.minLength(10)]],
    contactInfo:  ['', [Validators.required, Validators.minLength(5)]]
  });

  ngOnInit() {
    this.loadStolenVehicles();
  }

  loadStolenVehicles() {
    this.isStolenLoading.set(true);
    this.policeService.getStolenVehicles().subscribe({
      next: (data) => { this.stolenVehicles.set(data); this.isStolenLoading.set(false); },
      error: () => { this.isStolenLoading.set(false); }
    });
  }

  toggleReportStolenForm() {
    this.showReportStolenForm.update(v => !v);
    this.reportStolenError.set('');
    this.reportStolenSuccess.set('');
    if (!this.showReportStolenForm()) this.reportStolenForm.reset();
  }

  reportStolen() {
    if (this.reportStolenForm.invalid) { this.reportStolenForm.markAllAsTouched(); return; }
    this.isReportingStolenLoading.set(true);
    this.reportStolenError.set('');
    this.policeService.reportStolenVehicle(this.reportStolenForm.value as any).subscribe({
      next: () => {
        this.isReportingStolenLoading.set(false);
        this.reportStolenSuccess.set('Пријава је успешно поднета. Возило је додато у евиденцију.');
        this.reportStolenForm.reset();
        this.loadStolenVehicles();
        setTimeout(() => { this.showReportStolenForm.set(false); this.reportStolenSuccess.set(''); }, 3000);
      },
      error: () => { this.reportStolenError.set('Грешка при пријави. Покушајте поново.'); this.isReportingStolenLoading.set(false); }
    });
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('sr-RS', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
}

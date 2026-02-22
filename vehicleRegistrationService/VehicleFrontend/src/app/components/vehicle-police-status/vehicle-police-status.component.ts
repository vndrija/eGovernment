import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { PoliceService } from '../../services/police.service';

@Component({
  selector: 'app-vehicle-police-status',
  standalone: true,
  imports: [CommonModule, ToastModule],
  providers: [MessageService],
  template: `
    <p-toast></p-toast>

    @if (isLoading()) {
      <div class="flex items-center gap-1.5 text-xs text-gray-400">
        <i class="pi pi-spin pi-spinner" style="font-size: 0.6rem"></i>
        <span>Провера са МУП-ом...</span>
      </div>

    } @else if (policeReport()) {
      <div class="space-y-2 text-xs">

        <!-- Status row + action icons -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full flex-shrink-0" [ngClass]="getStatusDotClass()"></span>
            <span class="font-medium text-gray-700">{{ getStatusInSerbian(computeStatus()) }}</span>
          </div>
          <div class="flex items-center gap-2">
            <button
              class="text-gray-300 hover:text-[#003893] transition-colors"
              title="Освежи"
              (click)="checkPoliceStatus()"
            ><i class="pi pi-refresh" style="font-size: 0.65rem"></i></button>
            <button
              class="text-gray-300 hover:text-[#003893] transition-colors"
              title="Пријави полицији"
              (click)="reportVehicle()"
            ><i class="pi pi-send" style="font-size: 0.65rem"></i></button>
          </div>
        </div>

        <!-- Stolen -->
        @if (policeReport()!.isStolen) {
          <p class="text-[#C6363C] font-semibold">
            ⚠ Возило пријављено као украдено
          </p>
        }

        <!-- Active warrants -->
        @if (policeReport()!.activeWarrants?.length > 0) {
          @for (w of policeReport()!.activeWarrants; track $index) {
            <p class="text-[#C6363C]">⚠ {{ w.flagType }}: {{ w.description }}</p>
          }
        }

        <!-- Outstanding fines -->
        @if (policeReport()!.totalFinesDue > 0) {
          <p class="text-amber-700">
            Неплаћено: <span class="font-semibold">{{ policeReport()!.totalFinesDue | number }} RSD</span>
          </p>
        }

        <!-- Unpaid violations -->
        @if (policeReport()!.unpaidViolations?.length > 0) {
          <div class="space-y-2 pt-0.5">
            @for (v of policeReport()!.unpaidViolations; track $index) {
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="text-gray-700 font-medium truncate">{{ v.type }}</p>
                  <p class="text-gray-400 truncate" style="font-size: 0.65rem">
                    {{ v.location }} · {{ formatDate(v.violationDate) }}
                  </p>
                </div>
                <div class="flex-shrink-0 text-right">
                  <p class="font-semibold text-gray-700">{{ v.fineAmount | number }} RSD</p>
                  <p [ngClass]="getViolationStatusClass(v.status)" style="font-size: 0.65rem">
                    {{ getViolationStatusInSerbian(v.status) }}
                  </p>
                </div>
              </div>
            }
          </div>
        } @else if (!policeReport()!.isStolen && policeReport()!.activeWarrants?.length === 0) {
          <p class="text-green-600">Без налаза у евиденцији</p>
        }

      </div>

    } @else if (error()) {
      <p class="text-xs text-gray-400 italic">Провера тренутно није доступна</p>
    }
  `,
  styles: []
})
export class VehiclePoliceStatusComponent implements OnInit {
  @Input() vehicleId!: number;

  private policeService = inject(PoliceService);
  private messageService = inject(MessageService);

  policeReport = signal<any | null>(null);
  isLoading = signal(false);
  isReporting = signal(false);
  error = signal<string | null>(null);

  ngOnInit() {
    this.checkPoliceStatus();
  }

  checkPoliceStatus() {
    this.isLoading.set(true);
    this.error.set(null);

    this.policeService.checkVehicleWithPolice(this.vehicleId).subscribe({
      next: (response) => {
        this.policeReport.set(response.policeReport);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set('Провера није успела');
        this.isLoading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Грешка',
          detail: 'Није могуће добити податке МУП-а',
          life: 5000
        });
      }
    });
  }

  reportVehicle() {
    this.isReporting.set(true);

    this.policeService.reportVehicleToPolice(this.vehicleId).subscribe({
      next: () => {
        this.isReporting.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Пријављено',
          detail: 'Возило је пријављено полицији',
          life: 3000
        });
      },
      error: () => {
        this.isReporting.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Грешка',
          detail: 'Пријава није успела',
          life: 5000
        });
      }
    });
  }

  // Compute status from new Go service response fields
  computeStatus(): string {
    const r = this.policeReport();
    if (!r) return 'Clear';
    if (r.isStolen || r.activeWarrants?.length > 0) return 'Wanted';
    if (r.totalFinesDue > 0) return 'Alert';
    return 'Clear';
  }

  getStatusDotClass(): string {
    switch (this.computeStatus()) {
      case 'Wanted': return 'bg-[#C6363C]';
      case 'Alert':  return 'bg-amber-500';
      case 'Clear':  return 'bg-green-500';
      default:       return 'bg-gray-400';
    }
  }

  getStatusInSerbian(status: string): string {
    switch (status) {
      case 'Wanted': return 'Потражно';
      case 'Alert':  return 'Упозорење';
      case 'Clear':  return 'Без налаза';
      default:       return status;
    }
  }

  getViolationStatusInSerbian(status: string): string {
    switch (status?.toLowerCase()) {
      case 'pending':  return 'На чекању';
      case 'paid':     return 'Плаћено';
      case 'disputed': return 'Спорно';
      default:         return status;
    }
  }

  getViolationStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'pending':  return 'text-amber-600';
      case 'paid':     return 'text-green-600';
      case 'disputed': return 'text-blue-600';
      default:         return 'text-gray-500';
    }
  }

  // kept for potential external use
  getStatusBadgeClass(): string {
    return this.getStatusDotClass();
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('sr-RS', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  }
}

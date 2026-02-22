import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TrafficPoliceService } from '../../../../services/traffic-police.service';

export type AdminTabSection = 'violations' | 'accidents' | 'officers' | 'flags';

@Component({
  selector: 'app-admin-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ButtonModule],
  templateUrl: './admin-tab.component.html'
})
export class AdminTabComponent {
  private policeService = inject(TrafficPoliceService);
  private fb = inject(FormBuilder);

  activeSection = signal<AdminTabSection>('violations');

  setSection(sec: AdminTabSection) { this.activeSection.set(sec); }

  // ── Violations ───────────────────────────────────────────────────
  isIssuingViolation = signal(false);
  issueViolationError = signal('');
  issueViolationSuccess = signal('');
  issueViolationForm = this.fb.group({
    vehiclePlate: ['', [Validators.required, Validators.minLength(3)]],
    type: ['SPEEDING', Validators.required],
    description: ['', [Validators.required, Validators.minLength(5)]],
    location: ['', Validators.required],
    fineAmount: [0, [Validators.required, Validators.min(1)]],
    offenderEmail: ['', [Validators.email]]
  });

  issueViolation() {
    if (this.issueViolationForm.invalid) { this.issueViolationForm.markAllAsTouched(); return; }
    this.isIssuingViolation.set(true);
    this.issueViolationError.set('');
    const dto = { ...this.issueViolationForm.value, officerId: 1 } as any;
    this.policeService.issueViolation(dto).subscribe({
      next: () => {
        this.isIssuingViolation.set(false);
        this.issueViolationSuccess.set('Прекршај је успешно евидентиран.');
        this.issueViolationForm.reset({ type: 'SPEEDING', fineAmount: 0 });
        setTimeout(() => { this.issueViolationSuccess.set(''); }, 3000);
      },
      error: () => { this.issueViolationError.set('Грешка при евидентирању прекршаја.'); this.isIssuingViolation.set(false); }
    });
  }

  // ── Accidents ────────────────────────────────────────────────────
  isReportingAccident = signal(false);
  reportAccidentError = signal('');
  reportAccidentSuccess = signal('');
  reportAccidentForm = this.fb.group({
    location:       ['', Validators.required],
    description:    ['', [Validators.required, Validators.minLength(10)]],
    severity:       ['MINOR', Validators.required],
    involvedPlates: ['', Validators.required]
  });

  reportAccident() {
    if (this.reportAccidentForm.invalid) { this.reportAccidentForm.markAllAsTouched(); return; }
    this.isReportingAccident.set(true);
    this.reportAccidentError.set('');
    this.policeService.reportAccident(this.reportAccidentForm.value as any).subscribe({
      next: () => {
        this.isReportingAccident.set(false);
        this.reportAccidentSuccess.set('Незгода је успешно пријављена.');
        this.reportAccidentForm.reset({ severity: 'MINOR' });
        setTimeout(() => { this.reportAccidentSuccess.set(''); }, 3000);
      },
      error: () => { this.reportAccidentError.set('Грешка при пријави незгоде.'); this.isReportingAccident.set(false); }
    });
  }

  // ── Officers ─────────────────────────────────────────────────────
  isAddingOfficer = signal(false);
  addOfficerError = signal('');
  addOfficerSuccess = signal('');
  addOfficerForm = this.fb.group({
    badgeNumber: ['', [Validators.required, Validators.minLength(3)]],
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    rank: ['Полицајац', Validators.required],
    stationId: ['', Validators.required],
    userId: ['']
  });

  addOfficer() {
    if (this.addOfficerForm.invalid) { this.addOfficerForm.markAllAsTouched(); return; }
    this.isAddingOfficer.set(true);
    this.addOfficerError.set('');
    this.policeService.createOfficer(this.addOfficerForm.value as any).subscribe({
      next: () => {
        this.isAddingOfficer.set(false);
        this.addOfficerSuccess.set('Службеник је успешно додат.');
        this.addOfficerForm.reset({ rank: 'Полицајац' });
        setTimeout(() => { this.addOfficerSuccess.set(''); }, 3000);
      },
      error: () => { this.addOfficerError.set('Грешка при додавању службеника.'); this.isAddingOfficer.set(false); }
    });
  }

  // ── Flags ────────────────────────────────────────────────────────
  isAddingFlag = signal(false);
  addFlagError = signal('');
  addFlagSuccess = signal('');
  addFlagForm = this.fb.group({
    vehiclePlate: ['', [Validators.required, Validators.minLength(3)]],
    flagType: ['', Validators.required],
    description: ['', [Validators.required, Validators.minLength(5)]]
  });

  addFlag() {
    if (this.addFlagForm.invalid) { this.addFlagForm.markAllAsTouched(); return; }
    this.isAddingFlag.set(true);
    this.addFlagError.set('');
    this.policeService.addFlag(this.addFlagForm.value as any).subscribe({
      next: () => {
        this.isAddingFlag.set(false);
        this.addFlagSuccess.set('Маркирање је успешно додато.');
        this.addFlagForm.reset();
        setTimeout(() => { this.addFlagSuccess.set(''); }, 3000);
      },
      error: () => { this.addFlagError.set('Грешка при додавању маркирања.'); this.isAddingFlag.set(false); }
    });
  }
}

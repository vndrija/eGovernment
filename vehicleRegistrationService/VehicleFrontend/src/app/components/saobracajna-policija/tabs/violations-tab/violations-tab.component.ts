import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { FileUploadModule } from 'primeng/fileupload';
import { MessageService } from 'primeng/api';
import { TrafficPoliceService, Violation } from '../../../../services/traffic-police.service';
import { SignaturePadComponent } from '../../../signature-pad/signature-pad.component';

@Component({
  selector: 'app-violations-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, DialogModule, FileUploadModule, SignaturePadComponent],
  templateUrl: './violations-tab.component.html'
})
export class ViolationsTabComponent {
  private policeService = inject(TrafficPoliceService);
  private messageService = inject(MessageService);

  violationsPlate = '';
  violations = signal<Violation[]>([]);
  isViolationsLoading = signal(false);
  violationsSearched = signal(false);
  violationsError = signal('');
  payingId = signal<number | null>(null);
  downloadingId = signal<number | null>(null);

  // Dialog State
  isPayDialogVisible = signal(false);
  isSubmittingPayment = signal(false);
  invoiceFile = signal<File | null>(null);
  signatureData = signal<string>('');
  isSignatureCaptured = signal(false);
  paymentError = signal<string>('');

  searchViolations() {
    const plate = this.violationsPlate.trim();
    if (!plate) return;
    this.isViolationsLoading.set(true);
    this.violationsError.set('');
    this.violationsSearched.set(true);
    this.policeService.getViolationsByPlate(plate).subscribe({
      next: (data) => { this.violations.set(data); this.isViolationsLoading.set(false); },
      error: () => { this.violationsError.set('Грешка при претрази.'); this.isViolationsLoading.set(false); }
    });
  }

  openPayDialog(id: number) {
    this.payingId.set(id);
    this.isPayDialogVisible.set(true);
    this.invoiceFile.set(null);
    this.signatureData.set('');
    this.isSignatureCaptured.set(false);
    this.paymentError.set('');
  }

  onFileUpload(event: any) {
    if (event.files && event.files.length > 0) {
      this.invoiceFile.set(event.files[0]);
    }
  }

  onSignatureCaptured(signatureData: string): void {
    this.signatureData.set(signatureData);
    this.isSignatureCaptured.set(!!signatureData);
    this.paymentError.set('');
  }

  submitPayment() {
    if (!this.invoiceFile()) {
      this.paymentError.set('Молим вас отпремите доказ о уплати (PDF).');
      return;
    }
    if (!this.isSignatureCaptured()) {
      this.paymentError.set('Молим вас да потпишете пре него што наставите.');
      return;
    }

    const id = this.payingId();
    if (id === null) return;

    this.isSubmittingPayment.set(true);
    this.paymentError.set('');
    
    this.policeService.payViolation(id).subscribe({
      next: () => {
        this.isSubmittingPayment.set(false);
        this.isPayDialogVisible.set(false);
        this.payingId.set(null);
        this.messageService.add({ severity: 'success', summary: 'Успешно', detail: 'Казна је плаћена.', life: 3000 });
        this.searchViolations();
      },
      error: () => {
        this.isSubmittingPayment.set(false);
        this.paymentError.set('Плаћање није успело. Молимо покушајте поново.');
      }
    });
  }

  downloadPdf(id: number) {
    this.downloadingId.set(id);
    this.policeService.downloadViolationPdf(id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `prekrsaj_${id}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        this.downloadingId.set(null);
      },
      error: () => {
        this.downloadingId.set(null);
        this.messageService.add({ severity: 'error', summary: 'Грешка', detail: 'Преузимање PDF-а није успело.', life: 3000 });
      }
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

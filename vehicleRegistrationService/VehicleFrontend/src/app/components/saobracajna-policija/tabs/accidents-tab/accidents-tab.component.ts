import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip'; 
import { 
  TrafficPoliceService, 
  Accident, 
  VehicleDetails 
} from '../../../../services/traffic-police.service';

@Component({
  selector: 'app-accidents-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, TooltipModule],
  templateUrl: './accidents-tab.component.html'
})
export class AccidentsTabComponent {
  private policeService = inject(TrafficPoliceService);

  accidentsPlate = '';
  accidents = signal<Accident[]>([]);
  isAccidentsLoading = signal(false);
  accidentsSearched = signal(false);
  accidentsError = signal('');

  // Cache to store fetched vehicle details: Map<PlateNumber, VehicleData>
  vehicleCache = signal<Map<string, VehicleDetails>>(new Map());
  loadingVehicles = signal<Set<string>>(new Set()); // Track which plates are currently loading

  searchAccidents() {
    const plate = this.accidentsPlate.trim();
    if (!plate) return;
    
    this.isAccidentsLoading.set(true);
    this.accidentsError.set('');
    this.accidentsSearched.set(true);
    
    // Clear previous cache if you want a fresh start, or keep it to save bandwidth
    // this.vehicleCache.set(new Map()); 

    this.policeService.getAccidentsByPlate(plate).subscribe({
      next: (data) => { 
        this.accidents.set(data); 
        this.isAccidentsLoading.set(false);
        
        // After loading accidents, fetch details for all involved vehicles
        this.fetchInvolvedVehicles(data);
      },
      error: () => { 
        this.accidentsError.set('Грешка при претрази.'); 
        this.isAccidentsLoading.set(false); 
      }
    });
  }

  // Helper to parse CSV and fetch data
  private fetchInvolvedVehicles(accidents: Accident[]) {
    accidents.forEach(acc => {
      if (!acc.involvedPlates) return;

      // Split "BG-123-XX,NS-456-YY" into array
      const plates = acc.involvedPlates.split(',').map(p => p.trim());

      plates.forEach(plate => {
        // If we don't have it and aren't loading it yet...
        if (!this.vehicleCache().has(plate) && !this.loadingVehicles().has(plate)) {
          
          // Mark as loading
          this.loadingVehicles.update(set => {
            const newSet = new Set(set);
            newSet.add(plate);
            return newSet;
          });

          // Call the Go Proxy (which calls C#)
          this.policeService.getVehicleDetails(plate).subscribe({
            next: (vehicle) => {
              // Update Cache
              this.vehicleCache.update(map => {
                const newMap = new Map(map);
                // FIX: 'vehicle' is the object itself, no need for '.data'
                newMap.set(plate, vehicle); 
                return newMap;
              });
              // Remove from loading
              this.removeLoading(plate);
            },
            error: () => {
              console.warn(`Could not fetch details for vehicle: ${plate}`);
              this.removeLoading(plate);
            }
          });
        }
      });
    });
  }

  private removeLoading(plate: string) {
    this.loadingVehicles.update(set => {
      const newSet = new Set(set);
      newSet.delete(plate);
      return newSet;
    });
  }

  // Helper for HTML template to split string safely
  getPlatesArray(csv: string): string[] {
    return csv ? csv.split(',').map(p => p.trim()) : [];
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('sr-RS', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  severityLabel(s: string): string {
    const m: Record<string, string> = {
      'MINOR': 'Лака', 'MAJOR': 'Тешка', 'CRITICAL': 'Критична', 'FATAL': 'Смртоносна'
    };
    return m[s] ?? s;
  }
}

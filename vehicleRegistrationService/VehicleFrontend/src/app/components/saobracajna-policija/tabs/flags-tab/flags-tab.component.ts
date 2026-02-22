import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { 
  TrafficPoliceService, 
  VehicleFlag, 
  VehicleDetails 
} from '../../../../services/traffic-police.service';

@Component({
  selector: 'app-flags-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule],
  templateUrl: './flags-tab.component.html'
})
export class FlagsTabComponent {
  private policeService = inject(TrafficPoliceService);
  private messageService = inject(MessageService);

  flagsPlate = '';
  flags = signal<VehicleFlag[]>([]);
  isFlagsLoading = signal(false);
  flagsSearched = signal(false);
  flagsError = signal('');
  resolvingFlagId = signal<number | null>(null);

  // Cache for vehicle details (Make, Model, Owner)
  vehicleCache = signal<Map<string, VehicleDetails>>(new Map());

  searchFlags() {
    const plate = this.flagsPlate.trim();
    if (!plate) return;
    
    this.isFlagsLoading.set(true);
    this.flagsError.set('');
    this.flagsSearched.set(true);

    this.policeService.getFlagsByPlate(plate).subscribe({
      next: (data) => { 
        this.flags.set(data); 
        this.isFlagsLoading.set(false);
        
        // Fetch vehicle details immediately since we have the plate
        this.fetchVehicleDetails(plate);
      },
      error: () => { 
        this.flagsError.set('Грешка при претрази.'); 
        this.isFlagsLoading.set(false); 
      }
    });
  }

  // Helper to fetch rich data from C# Service via Go Proxy
  private fetchVehicleDetails(plate: string) {
    // If we already have it, don't fetch again
    if (this.vehicleCache().has(plate)) return;

    this.policeService.getVehicleDetails(plate).subscribe({
      next: (vehicle) => {
        this.vehicleCache.update(map => {
          const newMap = new Map(map);
          newMap.set(plate, vehicle);
          return newMap;
        });
      },
      error: () => {
        // Silently fail if vehicle registry is down or car not found
        console.warn(`Could not fetch details for ${plate}`);
      }
    });
  }

  resolveFlag(id: number) {
    this.resolvingFlagId.set(id);
    this.policeService.resolveFlag(id).subscribe({
      next: () => {
        this.resolvingFlagId.set(null);
        this.messageService.add({ severity: 'success', summary: 'Успешно', detail: 'Маркирање је уклоњено.', life: 3000 });
        this.searchFlags();
      },
      error: () => {
        this.resolvingFlagId.set(null);
        this.messageService.add({ severity: 'error', summary: 'Грешка', detail: 'Уклањање није успело.', life: 3000 });
      }
    });
  }
}

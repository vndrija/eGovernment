import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Vehicle,
  VehicleCreateRequest,
  VehicleUpdateRequest,
  VehicleResponse,
  VehicleListResponse
} from '../models/vehicle.models';

@Injectable({
  providedIn: 'root'
})
export class VehicleService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiConfig.vehicleService;

  getVehicles(): Observable<VehicleListResponse> {
    return this.http.get<VehicleListResponse>(this.apiUrl);
  }

  getVehicle(id: number): Observable<VehicleResponse> {
    return this.http.get<VehicleResponse>(`${this.apiUrl}/${id}`);
  }

  getVehiclesByOwner(ownerName: string): Observable<VehicleListResponse> {
    return this.http.get<VehicleListResponse>(`${this.apiUrl}/owner/${ownerName}`);
  }

  getVehiclesByOwnerId(ownerId: string): Observable<VehicleListResponse> {
    return this.http.get<VehicleListResponse>(`${this.apiUrl}/owner-id/${ownerId}`);
  }

  createVehicle(request: VehicleCreateRequest): Observable<VehicleResponse> {
    return this.http.post<VehicleResponse>(this.apiUrl, request);
  }

  updateVehicle(id: number, request: VehicleUpdateRequest): Observable<VehicleResponse> {
    return this.http.put<VehicleResponse>(`${this.apiUrl}/${id}`, request);
  }

  deleteVehicle(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getMyVehicles(): Observable<Vehicle[]> {
    return this.http.get<Vehicle[]>(this.apiUrl);
  }

  changeLicensePlate(vehicleId: number, request: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${vehicleId}/change-license-plate`, request);
  }

  getVehicleFines(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}/fines`);
  }
}

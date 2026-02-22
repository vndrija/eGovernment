import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SelectModule } from 'primeng/select';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { AuthService } from '../../services/auth.service';
import { VehicleService } from '../../services/vehicle.service';
import { VehicleTransferService } from '../../services/vehicle-transfer.service';
import { UserService, UserOption } from '../../services/user.service';
import { NavbarComponent } from '../navbar/navbar.component';
import { VehiclePoliceStatusComponent } from '../vehicle-police-status/vehicle-police-status.component';
import { UserDto, UpdateProfileRequest, ChangePasswordRequest } from '../../models/auth.models';
import { Vehicle, VehicleCreateRequest, VehicleUpdateRequest } from '../../models/vehicle.models';
import { VehicleOwnershipHistory } from '../../models/vehicle-transfer.models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    DialogModule,
    ConfirmDialogModule,
    SelectModule,
    ToastModule,
    NavbarComponent,
    VehiclePoliceStatusComponent
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private vehicleService = inject(VehicleService);
  private vehicleTransferService = inject(VehicleTransferService);
  private userService = inject(UserService);
  private router = inject(Router);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);

  currentUser = signal<UserDto | null>(null);
  availableUsers = signal<UserOption[]>([]);
  isLoadingUsers = signal<boolean>(false);

  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  createVehicleForm!: FormGroup;
  editVehicleForm!: FormGroup;
  detailsForm!: FormGroup;
  transferForm!: FormGroup;

  isEditingProfile = signal<boolean>(false);
  isChangingPassword = signal<boolean>(false);
  isLoadingProfile = signal<boolean>(false);
  isLoadingPassword = signal<boolean>(false);
  isLoadingVehicles = signal<boolean>(true);
  isCreatingVehicle = signal<boolean>(false);
  isUpdatingVehicle = signal<boolean>(false);
  isEditingInDetailsDialog = signal<boolean>(false);
  isLoadingOwnershipHistory = signal<boolean>(false);
  isCreatingTransfer = signal<boolean>(false);
  isLoadingFines = signal<boolean>(false);

  vehicleFines = signal<any[]>([]);
  totalFinesDue = signal<number>(0);

  userVehicles = signal<Vehicle[]>([]);
  selectedVehicle = signal<Vehicle | null>(null);
  showEditDialog = signal<boolean>(false);
  showCreateDialog = signal<boolean>(false);
  showDetailsDialog = signal<boolean>(false);
  showTransferForm = signal<boolean>(false);
  ownershipHistory = signal<VehicleOwnershipHistory[]>([]);

  profileError = signal<string>('');
  passwordError = signal<string>('');
  createVehicleError = signal<string>('');
  editVehicleError = signal<string>('');
  transferError = signal<string>('');

  currentYear = new Date().getFullYear();

  constructor() {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.loadUserData();
    this.loadUserVehicles();
  }

  private initializeForms(): void {
    this.profileForm = this.fb.group({
      username: [{ value: '', disabled: true }, [Validators.required, Validators.minLength(3)]],
      email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
      role: [{ value: '', disabled: true }]
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });

    this.createVehicleForm = this.fb.group({
      registrationNumber: ['', [Validators.required]],
      make: ['', [Validators.required]],
      model: ['', [Validators.required]],
      year: ['', [Validators.required, Validators.min(1900), Validators.max(this.currentYear)]]
    });

    this.editVehicleForm = this.fb.group({
      registrationNumber: [{ value: '', disabled: true }],
      chassisNumber: [{ value: '', disabled: true }],
      make: ['', [Validators.required]],
      model: ['', [Validators.required]],
      year: ['', [Validators.required, Validators.min(1900), Validators.max(this.currentYear)]],
      ownerName: [{ value: '', disabled: true }]
    });

    this.detailsForm = this.fb.group({
      registrationNumber: [{ value: '', disabled: true }],
      make: ['', [Validators.required]],
      model: ['', [Validators.required]],
      year: ['', [Validators.required, Validators.min(1900), Validators.max(this.currentYear)]],
      ownerName: [{ value: '', disabled: true }]
    });

    this.transferForm = this.fb.group({
      toUserId: ['', [Validators.required]]
    });
  }

  private passwordMatchValidator(form: FormGroup): { [key: string]: boolean } | null {
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');

    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  private loadUserData(): void {
    const user = this.authService.getUserData();
    if (user) {
      this.currentUser.set(user);
      this.profileForm.patchValue({
        username: user.username,
        email: user.email,
        role: user.role
      });
    } else {
      this.router.navigate(['/login']);
    }
  }

  private loadUserVehicles(): void {
    const user = this.currentUser();
    if (!user) return;

    this.isLoadingVehicles.set(true);
    this.vehicleService.getVehiclesByOwnerId(user.id.toString()).subscribe({
      next: (response) => {
        this.userVehicles.set(response.data);
        this.isLoadingVehicles.set(false);
      },
      error: (error) => {
        console.error('Failed to load vehicles', error);
        this.isLoadingVehicles.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Грешка',
          detail: 'Неуспешно учитавање возила'
        });
      }
    });
  }

  enableProfileEdit(): void {
    this.isEditingProfile.set(true);
    this.profileForm.get('username')?.enable();
    this.profileForm.get('email')?.enable();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  cancelProfileEdit(): void {
    this.isEditingProfile.set(false);
    this.loadUserData();
    this.profileForm.get('username')?.disable();
    this.profileForm.get('email')?.disable();
    this.profileError.set('');
  }

  saveProfile(): void {
    if (this.profileForm.invalid) return;

    this.isLoadingProfile.set(true);
    this.profileError.set('');

    const request: UpdateProfileRequest = {
      username: this.profileForm.value.username,
      email: this.profileForm.value.email
    };

    this.authService.updateProfile(request).subscribe({
      next: (response) => {
        this.authService.saveUserData(response.data);
        this.currentUser.set(response.data);
        this.isEditingProfile.set(false);
        this.profileForm.get('username')?.disable();
        this.profileForm.get('email')?.disable();
        this.isLoadingProfile.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Успех',
          detail: 'Профил успешно ажуриран'
        });
      },
      error: (error) => {
        this.profileError.set(error.error?.message || 'Неуспешна измена профила');
        this.isLoadingProfile.set(false);
      }
    });
  }

  togglePasswordChange(): void {
    this.isChangingPassword.update(value => !value);
    if (!this.isChangingPassword()) {
      this.passwordForm.reset();
      this.passwordError.set('');
    }
  }

  changePassword(): void {
    if (this.passwordForm.invalid) return;

    this.isLoadingPassword.set(true);
    this.passwordError.set('');

    const request: ChangePasswordRequest = {
      currentPassword: this.passwordForm.value.currentPassword,
      newPassword: this.passwordForm.value.newPassword
    };

    this.authService.changePassword(request).subscribe({
      next: (response) => {
        this.passwordForm.reset();
        this.isChangingPassword.set(false);
        this.isLoadingPassword.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Успех',
          detail: 'Лозинка успешно промењена'
        });
      },
      error: (error) => {
        this.passwordError.set(error.error?.message || 'Неуспешна промена лозинке');
        this.isLoadingPassword.set(false);
      }
    });
  }

  isVehicleExpiringSoon(vehicle: Vehicle): boolean {
    const expirationDate = new Date(vehicle.expirationDate);
    const today = new Date();
    const daysUntilExpiration = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiration <= 30 && daysUntilExpiration >= 0;
  }

  isVehicleExpired(vehicle: Vehicle): boolean {
    const expirationDate = new Date(vehicle.expirationDate);
    const today = new Date();
    return expirationDate < today;
  }

  openEditDialog(vehicle: Vehicle): void {
    this.selectedVehicle.set(vehicle);
    this.editVehicleForm.patchValue({
      registrationNumber: vehicle.registrationNumber,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      ownerName: vehicle.ownerName
    });
    this.editVehicleError.set('');
    this.showEditDialog.set(true);
  }

  closeEditDialog(): void {
    this.selectedVehicle.set(null);
    this.editVehicleForm.reset();
    this.editVehicleError.set('');
    this.showEditDialog.set(false);
  }

  deleteVehicle(vehicle: Vehicle): void {
    this.confirmationService.confirm({
      message: `Да ли сте сигурни да желите да обришете возило ${vehicle.registrationNumber}?`,
      header: 'Потврда брисања',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.vehicleService.deleteVehicle(vehicle.id).subscribe({
          next: () => {
            this.userVehicles.update(vehicles =>
              vehicles.filter(v => v.id !== vehicle.id)
            );
            this.messageService.add({
              severity: 'success',
              summary: 'Успех',
              detail: 'Возило успешно обрисано'
            });
          },
          error: (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Грешка',
              detail: 'Неуспешно брисање возила'
            });
          }
        });
      }
    });
  }

  formatDate(date: Date | string): string {
    if (!date) return '';
    const d = new Date(String(date).replace(' ', 'T'));
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('sr-RS', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  openCreateDialog(): void {
    this.showCreateDialog.set(true);
    this.createVehicleForm.reset();
    this.createVehicleError.set('');
  }

  closeCreateDialog(): void {
    this.showCreateDialog.set(false);
    this.createVehicleForm.reset();
    this.createVehicleError.set('');
  }

  createVehicle(): void {
    if (this.createVehicleForm.invalid) {
      Object.keys(this.createVehicleForm.controls).forEach(key => {
        this.createVehicleForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isCreatingVehicle.set(true);
    this.createVehicleError.set('');

    const request: VehicleCreateRequest = {
      registrationNumber: this.createVehicleForm.value.registrationNumber,
      make: this.createVehicleForm.value.make,
      model: this.createVehicleForm.value.model,
      year: this.createVehicleForm.value.year
    };

    this.vehicleService.createVehicle(request).subscribe({
      next: (response) => {
        this.userVehicles.update(vehicles => [...vehicles, response.data]);
        this.closeCreateDialog();
        this.isCreatingVehicle.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Успех',
          detail: 'Возило успешно додато'
        });
      },
      error: (error) => {
        this.createVehicleError.set(error.error?.message || 'Неуспешно додавање возила');
        this.isCreatingVehicle.set(false);
      }
    });
  }

  updateVehicle(): void {
    if (this.editVehicleForm.invalid) {
      Object.keys(this.editVehicleForm.controls).forEach(key => {
        this.editVehicleForm.get(key)?.markAsTouched();
      });
      return;
    }

    const vehicle = this.selectedVehicle();
    if (!vehicle) return;

    this.isUpdatingVehicle.set(true);
    this.editVehicleError.set('');

    const request: VehicleUpdateRequest = {
      make: this.editVehicleForm.value.make,
      model: this.editVehicleForm.value.model,
      year: this.editVehicleForm.value.year
    };

    this.vehicleService.updateVehicle(vehicle.id, request).subscribe({
      next: (response) => {
        this.userVehicles.update(vehicles =>
          vehicles.map(v => v.id === vehicle.id ? response.data : v)
        );
        this.closeEditDialog();
        this.isUpdatingVehicle.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Успех',
          detail: 'Возило успешно ажурирано'
        });
      },
      error: (error) => {
        this.editVehicleError.set(error.error?.message || 'Неуспешно ажурирање возила');
        this.isUpdatingVehicle.set(false);
      }
    });
  }

  // Details Dialog Methods
  openDetailsDialog(vehicle: Vehicle): void {
    this.selectedVehicle.set(vehicle);
    this.detailsForm.patchValue({
      registrationNumber: vehicle.registrationNumber,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      ownerName: vehicle.ownerName
    });
    this.showDetailsDialog.set(true);
    this.isEditingInDetailsDialog.set(false);
    this.loadOwnershipHistory(vehicle.id);
    this.loadVehicleFines(vehicle.id);
  }

  closeDetailsDialog(): void {
    this.showDetailsDialog.set(false);
    this.selectedVehicle.set(null);
    this.detailsForm.reset();
    this.isEditingInDetailsDialog.set(false);
    this.showTransferForm.set(false);
    this.transferForm.reset();
    this.transferError.set('');
    this.ownershipHistory.set([]);
    this.vehicleFines.set([]);
    this.totalFinesDue.set(0);
  }

  enableEditing(): void {
    this.isEditingInDetailsDialog.set(true);
  }

  cancelDetailsEditing(): void {
    const vehicle = this.selectedVehicle();
    if (vehicle) {
      this.detailsForm.patchValue({
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year
      });
    }
    this.isEditingInDetailsDialog.set(false);
  }

  saveDetailsEdits(): void {
    if (this.detailsForm.invalid) {
      Object.keys(this.detailsForm.controls).forEach(key => {
        this.detailsForm.get(key)?.markAsTouched();
      });
      return;
    }

    const vehicle = this.selectedVehicle();
    if (!vehicle) return;

    this.isUpdatingVehicle.set(true);

    const request: VehicleUpdateRequest = {
      make: this.detailsForm.value.make,
      model: this.detailsForm.value.model,
      year: this.detailsForm.value.year
    };

    this.vehicleService.updateVehicle(vehicle.id, request).subscribe({
      next: (response) => {
        this.userVehicles.update(vehicles =>
          vehicles.map(v => v.id === vehicle.id ? response.data : v)
        );
        this.selectedVehicle.set(response.data);
        this.isEditingInDetailsDialog.set(false);
        this.isUpdatingVehicle.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Успех',
          detail: 'Возило успешно ажурирано'
        });
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Грешка',
          detail: error.error?.message || 'Неуспешно ажурирање возила'
        });
        this.isUpdatingVehicle.set(false);
      }
    });
  }

  // Ownership History Methods
  loadOwnershipHistory(vehicleId: number): void {
    this.isLoadingOwnershipHistory.set(true);
    this.vehicleTransferService.getOwnershipHistory(vehicleId).subscribe({
      next: (response) => {
        this.ownershipHistory.set(response.data);
        this.isLoadingOwnershipHistory.set(false);
      },
      error: (error) => {
        console.error('Failed to load ownership history', error);
        this.isLoadingOwnershipHistory.set(false);
        this.ownershipHistory.set([]);
      }
    });
  }

  loadVehicleFines(vehicleId: number): void {
    this.isLoadingFines.set(true);
    this.vehicleService.getVehicleFines(vehicleId).subscribe({
      next: (response) => {
        const fines = response.fines || [];
        this.vehicleFines.set(fines);
        const pending = fines.filter((f: any) => f.status === 'PENDING');
        this.totalFinesDue.set(pending.reduce((sum: number, f: any) => sum + f.fineAmount, 0));
        this.isLoadingFines.set(false);
      },
      error: () => {
        this.vehicleFines.set([]);
        this.totalFinesDue.set(0);
        this.isLoadingFines.set(false);
      }
    });
  }

  // Transfer Methods
  openTransferForm(): void {
    this.showTransferForm.set(true);
    this.transferForm.reset();
    this.transferError.set('');
    this.loadAvailableUsers();
  }

  loadAvailableUsers(): void {
    this.isLoadingUsers.set(true);
    this.userService.getAllUsers().subscribe({
      next: (response) => {
        // Filter out current user from the list
        const currentUserId = this.currentUser()?.id;
        const otherUsers = response.data.filter(u => u.id !== currentUserId);
        this.availableUsers.set(otherUsers);
        this.isLoadingUsers.set(false);
      },
      error: (error) => {
        this.transferError.set('Неуспешно учитавање листе корисника');
        this.isLoadingUsers.set(false);
      }
    });
  }

  closeTransferForm(): void {
    this.showTransferForm.set(false);
    this.transferForm.reset();
    this.transferError.set('');
  }

  createTransferRequest(): void {
    if (this.transferForm.invalid) {
      this.transferForm.get('toUserId')?.markAsTouched();
      return;
    }

    const vehicle = this.selectedVehicle();
    if (!vehicle) return;

    this.isCreatingTransfer.set(true);
    this.transferError.set('');

    const dto = {
      vehicleId: vehicle.id,
      toUserId: String(this.transferForm.value.toUserId)  // Convert number to string
    };

    this.vehicleTransferService.createTransfer(dto).subscribe({
      next: (response) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Успех',
          detail: 'Захтев за пренос успешно послат'
        });
        this.closeTransferForm();
        this.isCreatingTransfer.set(false);
      },
      error: (error) => {
        this.transferError.set(error.error?.message || 'Неуспешно креирање захтева за пренос');
        this.isCreatingTransfer.set(false);
      }
    });
  }
}

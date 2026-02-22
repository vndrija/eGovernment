import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { NavbarComponent } from '../navbar/navbar.component';
import { CheckTabComponent } from './tabs/check-tab/check-tab.component';
import { StolenTabComponent } from './tabs/stolen-tab/stolen-tab.component';
import { ViolationsTabComponent } from './tabs/violations-tab/violations-tab.component';
import { AccidentsTabComponent } from './tabs/accidents-tab/accidents-tab.component';
import { OfficersTabComponent } from './tabs/officers-tab/officers-tab.component';
import { FlagsTabComponent } from './tabs/flags-tab/flags-tab.component';
import { AdminTabComponent } from './tabs/admin-tab/admin-tab.component';
import { AuthService } from '../../services/auth.service';

export type Tab = 'check' | 'stolen' | 'violations' | 'accidents' | 'officers' | 'flags' | 'admin';

@Component({
  selector: 'app-saobracajna-policija',
  standalone: true,
  imports: [
    CommonModule,
    ToastModule,
    NavbarComponent,
    CheckTabComponent,
    StolenTabComponent,
    ViolationsTabComponent,
    AccidentsTabComponent,
    OfficersTabComponent,
    FlagsTabComponent,
    AdminTabComponent
  ],
  providers: [MessageService],
  templateUrl: './saobracajna-policija.component.html'
})
export class SaobracajnaPolicija implements OnInit {
  private router = inject(Router);
  private authService = inject(AuthService);

  activeTab = signal<Tab>('check');

  ngOnInit() {
    // Check if user is admin, if so, maybe they default to check, or just keep check.
  }

  setTab(tab: Tab) {
    this.activeTab.set(tab);
  }

  isAdmin(): boolean {
    const user = this.authService.getUserData();
    return user?.role === 'Admin' || user?.role === 'TrafficOfficer';
  }

  goBack() {
    this.router.navigate(['/']);
  }
}

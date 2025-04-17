import { Routes } from '@angular/router';
import { LandingPageComponent } from './Component/home/home.component';
import { ServicesComponent } from './Component/services/services.component';

export const routes: Routes = [
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    { path: 'home', component: LandingPageComponent },
    { path: 'services', component: ServicesComponent }
];

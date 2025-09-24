import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { UploadComponent } from './components/upload/upload.component';
import { ReportComponent } from './components/report/report.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './components/register/register.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'upload', component: UploadComponent },
  { path: 'report', component: ReportComponent },
  { path: 'login', component: LoginComponent},
  { path: 'register', component: RegisterComponent },

  { path: '**', redirectTo: '' }
];
import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { UploadComponent } from './components/upload/upload.component';
import { ReportComponent } from './components/report/report.component';
import { LoginComponent } from './auth/login/login.component';
import { InfoComponent } from './components/info/info.component';
import { RegisterComponent } from './auth/register/register.component';
import { ReportesComponent } from './components/reportes/reportes.component';
import { PerfilComponent } from './components/perfil/perfil.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'upload', component: UploadComponent },
  { path: 'report', component: ReportComponent },
  { path: 'reportes', component: ReportesComponent },
  { path: 'perfil', component: PerfilComponent },
  { path: 'login', component: LoginComponent},
  { path: 'register', component: RegisterComponent },
  { path: 'info', component: InfoComponent },
  { path: '**', redirectTo: '' }
];
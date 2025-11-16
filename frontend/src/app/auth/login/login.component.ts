import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment'

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  username = '';
  password = '';
  registerDocumento = '';
  registerNombre = '';
  registerPassword = '';

  constructor(private router: Router, private http: HttpClient) {}
  
  private apiUrl = `${environment.apiUrl}`;

  submit() {
    const datos = {
      usuario: this.username,  // Cambiado de 'documento' a 'usuario'
      password: this.password
    };

    this.http.post<any>(`${this.apiUrl}/login`, datos).subscribe({
      next: (resp) => {
        if (resp.access_token) {
          // Guardar token y datos del usuario
          localStorage.setItem('token', resp.access_token);
          if (resp.user) {
            localStorage.setItem('user', JSON.stringify(resp.user));

            this.http.post(`${this.apiUrl}/storeUser`, resp.user, {
              headers: { Authorization: `Bearer ${resp.access_token}` }
            }).subscribe({
              error: (err) => console.error('Error storing user:', err)
            });
          }
          
          // Redirigir a la página principal de la aplicación
          this.router.navigate(['/upload']);
        }
      },
      error: () => {
        alert('Usuario o contraseña incorrectos');
      }
    });
  }

  register() {
    const datos = {
      documento: this.registerDocumento,
      nombre: this.registerNombre,
      password: this.registerPassword
    };

    this.http.post<any>(this.apiUrl, datos).subscribe({
      next: () => {
        alert('Registro exitoso');
        this.showLogin();
      },
      error: () => {
        alert('Error al registrar');
      }
    });
  }

  showLogin() {
    document.getElementById('container')?.classList.remove('right-panel-active');
  }

 showRegister() {
    this.router.navigate(['/register']);
  }

  irARegister() {
    this.showRegister();
  }
}
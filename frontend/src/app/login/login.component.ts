import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

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

  submit() {
    const datos = {
      documento: this.username,
      password: this.password
    };

    this.http.post<any>('http://localhost:8000/login', datos).subscribe({
      next: (resp) => {
        if (resp.access_token) {
          localStorage.setItem('token', resp.access_token);
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

    this.http.post<any>('http://localhost:8000/register', datos).subscribe({
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
    document.getElementById('container')?.classList.add('right-panel-active');
  }

  irARegister() {
    this.showRegister();
  }
}
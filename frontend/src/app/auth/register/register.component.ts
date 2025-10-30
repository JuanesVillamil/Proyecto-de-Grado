import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { enviroment } from '../../../../enviroment'

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, HttpClientModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  nombre = '';
  usuario = '';  // Cambiado de 'documento' a 'usuario'
  fechaNacimiento = '';
  password = '';
  rol = 'Radiólogo'; // Valor predeterminado con mayúscula

  constructor(private http: HttpClient, private router: Router) {}

  private apiUrl = `${enviroment.apiUrl}`;

  submit() {
    if (!this.rol) {
      alert('Por favor seleccione un rol antes de continuar.');
      return;
    }

    const datos = {
      nombre: this.nombre,
      usuario: this.usuario,  // Cambiado de 'documento' a 'usuario'
      fecha_nacimiento: this.fechaNacimiento,
      rol: this.rol,
      password: this.password,
      observaciones: ""  // Agregar campo observaciones
    };

    this.http.post(`${this.apiUrl}/register`, datos)
      .subscribe({
        next: () => {
          alert('¡Registro exitoso!');
          // Limpia el formulario si quieres
        },
        error: (err) => {
          console.error('Error completo:', err);  // Para debug
          const errorMessage = err.error?.detail || err.message || 'Error desconocido';
          alert('Error al registrar: ' + errorMessage);
        }
      });
  }
  showLogin() {
  document.getElementById('container')?.classList.remove('right-panel-active');
}

showRegister() {
  document.getElementById('container')?.classList.add('right-panel-active');
}

// Agrega este método en register.component.ts
irALogin() {
  this.router.navigate(['/login']);
}
}
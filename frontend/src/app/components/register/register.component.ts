import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, HttpClientModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  nombre = '';
  documento = '';
  fechaNacimiento = '';
  password = '';
  rol = '';

  constructor(private http: HttpClient) {}

  submit() {
    if (!this.rol) {
      alert('Por favor seleccione un rol antes de continuar.');
      return;
    }

    const datos = {
      nombre: this.nombre,
      documento: this.documento,
      fecha_nacimiento: this.fechaNacimiento,
      rol: this.rol,
      password: this.password
    };

    this.http.post('http://localhost:8000/register', datos)
      .subscribe({
        next: () => {
          alert('¡Registro exitoso!');
          // Limpia el formulario si quieres
        },
        error: (err) => {
          alert('Error al registrar: ' + (err.error?.detail || 'Error desconocido'));
        }
      });
  }
}
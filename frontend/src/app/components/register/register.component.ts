import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './register.component.html',
styleUrls: ['./register.component.scss']

})
export class RegisterComponent {
  nombre = '';
  documento = '';
  fechaNacimiento = '';
  password = '';
  rol = '';   

  submit() {
    if (!this.rol) {
      alert('Por favor seleccione un rol antes de continuar.');
      return;
    }

    console.log('Datos de registro:', {
      nombre: this.nombre,
      documento: this.documento,
      fechaNacimiento: this.fechaNacimiento,
      password: this.password,
      rol: this.rol
    });

    alert(`Registro enviado como ${this.rol}`);
  }
}

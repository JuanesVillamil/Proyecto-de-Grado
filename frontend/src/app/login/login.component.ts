import { Component } from '@angular/core';
import { Router } from '@angular/router';
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

  constructor(private router: Router) {}

  submit() {
    // Aquí puedes agregar la lógica de autenticación si la necesitas
    // Si el login es exitoso, navega a /upload
    this.router.navigate(['/upload']);
  }

  irARegister() {
    this.router.navigate(['/register']);
  }
}
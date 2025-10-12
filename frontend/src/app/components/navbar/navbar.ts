import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Location } from '@angular/common';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class Navbar {
  showMenu = false;

  constructor(private router: Router, private location: Location) {}

  volver() {
    this.location.back();
  }

  cerrarSesion() {
    // Mostrar confirmación antes de cerrar sesión
    const confirmar = confirm('¿Estás seguro de que quieres cerrar sesión?');
    
    if (confirmar) {
      // Limpiar el token y datos del usuario del localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Redirigir a la pantalla principal (login)
      this.router.navigate(['/login']);
      
      console.log('Sesión cerrada exitosamente');
    }
  }

  Informacion() {
    this.router.navigate(['/info']);
  }

}
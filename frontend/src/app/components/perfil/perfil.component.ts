import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Location } from '@angular/common';

interface Usuario {
  id: number;
  usuario: string;  // Cambiado de 'documento' a 'usuario'
  nombre: string;
  fecha_nacimiento: string;
  rol: string;
  observaciones?: string;
}

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.scss']
})
export class PerfilComponent implements OnInit {
  usuario: Usuario = {
    id: 0,
    usuario: '',  // Cambiado de 'documento' a 'usuario'
    nombre: '',
    fecha_nacimiento: '',
    rol: '',
    observaciones: ''
  };
  
  usuarioOriginal: Usuario = { ...this.usuario };
  editMode = false;
  loading = false;
  mensaje = '';
  tipoMensaje: 'success' | 'error' = 'success';

  constructor(
    private http: HttpClient,
    private router: Router,
    private location: Location
  ) {}

  ngOnInit() {
    this.cargarDatosUsuario();
  }

  cargarDatosUsuario() {
    const userData = localStorage.getItem('user');
    if (userData) {
      const userFromStorage = JSON.parse(userData);
      
      // Cargar datos completos desde el servidor
      this.loading = true;
      this.http.get<Usuario>(`http://localhost:8000/usuario/${userFromStorage.id}`)
        .subscribe({
          next: (usuario) => {
            this.usuario = usuario;
            this.usuarioOriginal = { ...usuario };
            this.loading = false;
          },
          error: (error) => {
            console.error('Error cargando datos:', error);
            // Si no se puede cargar desde servidor, usar datos del localStorage
            this.usuario = {
              id: userFromStorage.id,
              usuario: userFromStorage.usuario || userFromStorage.documento || '',  // Compatibilidad con ambos campos
              nombre: userFromStorage.nombre,
              fecha_nacimiento: userFromStorage.fecha_nacimiento || '',
              rol: userFromStorage.rol || 'Radiólogo',
              observaciones: userFromStorage.observaciones || ''
            };
            this.usuarioOriginal = { ...this.usuario };
            this.loading = false;
          }
        });
    } else {
      this.router.navigate(['/login']);
    }
  }

  activarEdicion() {
    this.editMode = true;
    this.mensaje = '';
  }

  cancelarEdicion() {
    this.usuario = { ...this.usuarioOriginal };
    this.editMode = false;
    this.mensaje = '';
  }

  guardarCambios() {
    if (!this.validarDatos()) {
      return;
    }

    this.loading = true;
    this.http.put(`http://localhost:8000/usuario/${this.usuario.id}`, this.usuario)
      .subscribe({
        next: (response: any) => {
          this.usuarioOriginal = { ...this.usuario };
          this.editMode = false;
          this.loading = false;
          this.mostrarMensaje('Datos actualizados correctamente', 'success');
          
          // Actualizar localStorage
          localStorage.setItem('user', JSON.stringify(this.usuario));
        },
        error: (error) => {
          console.error('Error actualizando datos:', error);
          this.loading = false;
          this.mostrarMensaje('Error al actualizar los datos', 'error');
        }
      });
  }

  validarDatos(): boolean {
    if (!this.usuario.nombre.trim()) {
      this.mostrarMensaje('El nombre es obligatorio', 'error');
      return false;
    }
    
    if (!this.usuario.usuario.trim()) {
      this.mostrarMensaje('El usuario es obligatorio', 'error');
      return false;
    }
    
    if (!this.usuario.fecha_nacimiento) {
      this.mostrarMensaje('La fecha de nacimiento es obligatoria', 'error');
      return false;
    }
    
    return true;
  }

  mostrarMensaje(texto: string, tipo: 'success' | 'error') {
    this.mensaje = texto;
    this.tipoMensaje = tipo;
    
    setTimeout(() => {
      this.mensaje = '';
    }, 5000);
  }

  volver() {
     this.location.back();
  }

  cambiarPassword() {
    // Implementar modal para cambiar contraseña
    console.log('Cambiar contraseña - Por implementar');
  }
}
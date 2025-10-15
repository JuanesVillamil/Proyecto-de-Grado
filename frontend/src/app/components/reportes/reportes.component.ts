import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

interface Reporte {
  id: number;
  usuario_id: number;
  fecha_creacion: string;
  resultado_birads: string;
  detalles_json: string;
  archivo_reporte: string;
}

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.scss']
})
export class ReportesComponent implements OnInit {
  reportes: Reporte[] = [];
  loading = false;
  usuario: any = null;
  reporteSeleccionado: Reporte | null = null;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit() {
    this.cargarUsuario();
    // cargarReportes() se llama desde cargarUsuario() después de validar el usuario
  }

  cargarUsuario() {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        this.usuario = JSON.parse(userData);
        console.log('Usuario cargado:', this.usuario); // Debug
        
        // Verificar que el usuario tenga ID
        if (this.usuario && this.usuario.id) {
          this.cargarReportes();
        } else {
          console.error('Usuario sin ID válido:', this.usuario);
          this.router.navigate(['/login']);
        }
      } catch (error) {
        console.error('Error parseando datos de usuario:', error);
        this.router.navigate(['/login']);
      }
    } else {
      // Si no hay usuario, redirigir al login
      console.log('No hay datos de usuario en localStorage');
      this.router.navigate(['/login']);
    }
  }

  cargarReportes() {
    if (!this.usuario || !this.usuario.id) {
      console.error('No se puede cargar reportes: usuario inválido');
      return;
    }
    
    console.log(`Cargando reportes para usuario ID: ${this.usuario.id}`); // Debug
    this.loading = true;
    
    this.http.get<Reporte[]>(`http://localhost:8000/reportes/${this.usuario.id}`)
      .subscribe({
        next: (reportes) => {
          console.log('Reportes recibidos:', reportes); // Debug
          this.reportes = reportes;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error cargando reportes:', error);
          this.loading = false;
        }
      });
  }

  descargarReporte(reporteId: number) {
    const url = `http://localhost:8000/reportes/${reporteId}/download`;
    window.open(url, '_blank');
  }

  getBiradsColor(birads: string): string {
    switch (birads) {
      case 'BI-RADS 1': return '#28a745'; // Verde
      case 'BI-RADS 2': return '#28a745'; // Verde
      case 'BI-RADS 3': return '#ffc107'; // Amarillo
      case 'BI-RADS 4': return '#fd7e14'; // Naranja
      case 'BI-RADS 5': return '#dc3545'; // Rojo
      default: return '#6c757d'; // Gris
    }
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  volver() {
    this.router.navigate(['/home']);
  }

  mostrarDetalles(reporte: Reporte) {
    this.reporteSeleccionado = reporte;
  }

  cerrarDetalles() {
    this.reporteSeleccionado = null;
  }
}
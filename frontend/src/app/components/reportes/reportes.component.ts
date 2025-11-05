import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { Navbar } from '../navbar/navbar';
import { enviroment } from '../../../../enviroment'
import jsPDF from 'jspdf';

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
  imports: [CommonModule, Navbar],
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
    private router: Router,
    private location: Location
  ) {}

  private apiUrl = `${enviroment.apiUrl}`;

  ngOnInit() {
    this.cargarUsuario();
    this.cargarReportes();
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
    
    this.http.get<{ reportes: Reporte[], total: number }>(`${this.apiUrl}/reportes/${this.usuario.id}`)
      .subscribe({
        next: (reportes) => {
          console.log('Reportes recibidos:', reportes); // Debug
          this.reportes = reportes.reportes;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error cargando reportes:', error);
          this.loading = false;
        }
      });
  }

    descargarReporte(reporteId: number) {
    const url = `${this.apiUrl}/reportes/download/${reporteId}`;
    const token = localStorage.getItem('access_token');

    fetch(url, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => {
      if (!response.ok) throw new Error(`Error al descargar: ${response.statusText}`);
      return response.json(); // 👈 Get JSON
    })
    .then(async data => {
      await this.descargarPDF(data); // 👈 Generates and downloads PDF
    })
    .catch(err => console.error('Error al descargar reporte:', err));
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
    this.location.back();
  }

  mostrarDetalles(reporte: Reporte) {
    this.reporteSeleccionado = reporte;
  }

  cerrarDetalles() {
    this.reporteSeleccionado = null;
  }

  async descargarPDF(reporte: any) {
    const doc = new jsPDF();
    let y = 20;

    // === Header ===
    doc.setFontSize(30);
    doc.setFont('helvetica', 'bold');
    doc.text('Reporte de Análisis BI-RADS', 105, y, { align: 'center' });
    y += 15;

    // === Metadata ===
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`ID del Reporte: ${reporte.id}`, 20, y);
    y += 7;
    doc.text(`Fecha de creación: ${reporte.fecha_creacion}`, 20, y);
    y += 7;
    doc.text(`Clasificación principal: ${reporte.resultado_birads}`, 20, y);
    y += 10;

    // === Leyenda BI-RADS ===
    doc.setFont('helvetica', 'bold');
    doc.text('Leyenda BI-RADS', 105, y, { align: 'center' });
    y += 8;

    const leyenda = [
      ['BI-RADS 1', 'Negativo'],
      ['BI-RADS 2', 'Hallazgos benignos'],
      ['BI-RADS 3', 'Probablemente benigno (<2%)'],
      ['BI-RADS 4', 'Sospechoso, biopsia recomendada'],
      ['BI-RADS 5', 'Altamente sugestivo de malignidad']
    ];

    doc.setFont('helvetica', 'normal');
    for (let [categoria, descripcion] of leyenda) {
      doc.text(`${categoria}: ${descripcion}`, 25, y);
      y += 6;
    }
    y += 10;

    // === Clasificación por Vista ===
    doc.setFont('helvetica', 'bold');
    doc.text('Clasificación por Vista', 105, y, { align: 'center' });
    y += 8;
    doc.setFont('helvetica', 'normal');

    const vistas = reporte.analisis_por_vista || {};
    for (const vista of Object.keys(vistas)) {
      const d = vistas[vista];
      const conf = (typeof d.confidence === 'number' && !isNaN(d.confidence))
        ? `${d.confidence.toFixed(2)}%`
        : 'N/A';
      doc.text(`${vista}: BI-RADS ${d.birads} (${conf})`, 25, y);
      y += 6;
    }

    y += 15;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(11);
    doc.text('Las imágenes procesadas y su análisis se incluirán en las siguientes páginas.', 105, y, { align: 'center' });

    // === Add image pages ===
    for (const vista of Object.keys(vistas)) {
      const d = vistas[vista];
      if (!d.image_url) continue;

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = d.image_url;

      await new Promise<void>((resolve) => {
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) ctx.drawImage(img, 0, 0);
          const imgData = canvas.toDataURL('image/jpeg');

          doc.addPage();
          let pageY = 30;
          doc.setFontSize(16);
          doc.setFont('helvetica', 'bold');
          doc.text(`Vista: ${vista}`, 105, pageY, { align: 'center' });
          pageY += 10;

          const imgW = 120;
          const imgH = 130;
          const imgX = (210 - imgW) / 2;
          doc.addImage(imgData, 'JPEG', imgX, pageY, imgW, imgH);

          pageY += imgH + 10;
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(12);
          doc.text(d.note || '', 105, pageY, { align: 'center' });

          resolve();
        };
        img.onerror = () => resolve();
      });
    }

    const fecha = new Date();
    const timestamp = `${fecha.getFullYear()}-${(fecha.getMonth()+1).toString().padStart(2, '0')}-${fecha.getDate().toString().padStart(2, '0')}_${fecha.getHours().toString().padStart(2, '0')}-${fecha.getMinutes().toString().padStart(2, '0')}`;
    doc.save(`Reporte_BI-RADS_${timestamp}.pdf`);
  }

}
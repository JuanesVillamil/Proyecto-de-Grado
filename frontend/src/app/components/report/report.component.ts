import { Component, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { jsPDF } from 'jspdf';

@Component({
  standalone: true,
  selector: 'app-report',
  imports: [CommonModule, FormsModule],
  templateUrl: './report.component.html',
})
export class ReportComponent {
  observacionesRadiologo: string = '';
  @ViewChild('reporte', { static: false }) reporteElement!: ElementRef;

  datosReporte: any = {
    paciente: 'No ingresado',
    documento: 'No ingresado',
    edad: 'No ingresado',
    fecha: new Date().toLocaleDateString(),
    birads: 'Sin clasificar',
    resumen: '',
    detalles: {}
  };

  objectKeys = Object.keys;

  constructor(private router: Router) {
    const nombre = localStorage.getItem('nombrePaciente') || 'No ingresado';
    const documento = localStorage.getItem('documentoPaciente') || 'No ingresado';
    const fechaNacimiento = localStorage.getItem('fechaNacimiento');
    let edad = 'No ingresado';

    if (fechaNacimiento) {
      const nacimiento = new Date(fechaNacimiento);
      const diferencia = Date.now() - nacimiento.getTime();
      const edadDate = new Date(diferencia);
      edad = Math.abs(edadDate.getUTCFullYear() - 1970).toString();
    }

    const hoy = new Date();
    const fecha = `${hoy.getDate()}/${hoy.getMonth() + 1}/${hoy.getFullYear()}`;

    const stored = localStorage.getItem('birads_resultado');
    let resumen = 'Sin resultados disponibles';
    let birads = 'Sin clasificar';
    let detalles = {};

    if (stored) {
      const resultado = JSON.parse(stored);
      detalles = resultado;
      const valores = Object.values(resultado)
        .map((v: any) => v.birads)
        .filter((v: any) => typeof v === 'number');
      if (valores.length > 0) {
        const promedio = valores.reduce((a, b) => a + b, 0) / valores.length;
        birads = Math.round(promedio).toString();
        resumen = `Clasificación promedio BI-RADS estimada: ${birads}`;
      }
    }

    this.datosReporte = {
      paciente: nombre,
      documento: documento,
      edad: edad,
      fecha: fecha,
      birads: birads,
      resumen: resumen,
      detalles: detalles
    };
  }

  private mapVistaLabel(vista: string): string {
    switch (vista.toUpperCase()) {
      case 'L-CC': return 'CC Izquierda (Cráneo-Caudal)';
      case 'R-CC': return 'CC Derecha (Cráneo-Caudal)';
      case 'L-MLO': return 'MLO Izquierda (Oblicua Medio-Lateral)';
      case 'R-MLO': return 'MLO Derecha (Oblicua Medio-Lateral)';
      default: return vista;
    }
  }

  async descargarPDF() {
    const doc = new jsPDF();
    let y = 20;

    doc.setFontSize(30);
    doc.setFont('helvetica', 'bold');
    doc.text('Reporte de Análisis BI-RADS', 105, y, { align: 'center' });

    y += 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.rect(20, y, 170, 20);
    doc.text('Paciente:', 25, y + 7);
    doc.setFont('helvetica', 'normal');
    doc.text(`${this.datosReporte.paciente}`, 50, y + 7);
    doc.setFont('helvetica', 'bold');
    doc.text('Documento:', 110, y + 7);
    doc.setFont('helvetica', 'normal');
    doc.text(`${this.datosReporte.documento}`, 145, y + 7);
    doc.setFont('helvetica', 'bold');
    doc.text('Edad:', 25, y + 15);
    doc.setFont('helvetica', 'normal');
    doc.text(`${this.datosReporte.edad} años`, 50, y + 15);
    doc.setFont('helvetica', 'bold');
    doc.text('Fecha:', 110, y + 15);
    doc.setFont('helvetica', 'normal');
    doc.text(`${this.datosReporte.fecha}`, 135, y + 15);

    y += 35;
    doc.setFontSize(13);
    doc.text(`Clasificación promedio: BI-RADS ${this.datosReporte.birads}`, 20, y);
    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.text(`Resumen: ${this.datosReporte.resumen}`, 20, y, { maxWidth: 170 });

    if (this.datosReporte.detalles && Object.keys(this.datosReporte.detalles).length > 0) {
      y += 20;
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('Clasificación por Vista', 105, y, { align: 'center' });
      y += 8;

      doc.setFontSize(12);
      for (let vista of Object.keys(this.datosReporte.detalles)) {
        const d = this.datosReporte.detalles[vista];
        if (!d || d.birads === undefined || d.confidence === undefined) continue;
        const vistaLabel = this.mapVistaLabel(vista);
        doc.setFont('helvetica', 'italic');
        const labelText = `${vistaLabel}: `;
        doc.text(labelText, 30, y, { baseline: 'top' });
        doc.setFont('helvetica', 'bold');
        const resultText = `BI-RADS ${d.birads} (${(d.confidence * 100).toFixed(2)}%)`;
        doc.text(resultText, 30 + doc.getTextWidth(labelText), y, { baseline: 'top' });
        y += 8;
      }
    }

    if (this.datosReporte.detalles && Object.keys(this.datosReporte.detalles).length > 0) {
      y += 15;
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('Imágenes Procesadas', 105, y, { align: 'center' });
      y += 10;

      const imageWidth = 80;
      const imageHeight = 80;
      const margin = 10;
      let x = 20;
      let counter = 0;

      for (const vista of Object.keys(this.datosReporte.detalles)) {
        const d = this.datosReporte.detalles[vista];
        if (!d || !d.image_url) continue;
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

            if (y + imageHeight > 270) {
              doc.addPage();
              y = 20;
            }

            doc.addImage(imgData, 'JPEG', x, y, imageWidth, imageHeight);
            doc.text(this.mapVistaLabel(vista), x + imageWidth / 2, y + imageHeight + 5, { align: 'center' });

            counter++;
            x += imageWidth + margin;
            if (counter % 2 === 0) {
              x = 20;
              y += imageHeight + 20;
            }
            resolve();
          };
          img.onerror = () => resolve();
        });
      }
    }

    y += 110;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Observaciones del Radiólogo:', 20, y);
    y += 8;
    doc.setFont('helvetica', 'normal');
    const observaciones = this.observacionesRadiologo || 'Sin observaciones añadidas.';
    doc.text(observaciones, 20, y, { maxWidth: 170 });

    doc.save(`Reporte_${this.datosReporte.paciente}_${this.datosReporte.fecha}.pdf`);
  }

  volver() {
    this.router.navigate(['/results']);
  }
}
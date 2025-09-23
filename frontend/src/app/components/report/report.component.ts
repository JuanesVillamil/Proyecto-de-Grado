import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { jsPDF } from 'jspdf';
import { Navbar } from "../../navbar/navbar";
import { Chart } from 'chart.js/auto';

@Component({
  standalone: true,
  selector: 'app-report',
  imports: [CommonModule, FormsModule, Navbar],
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.scss']
})
export class ReportComponent implements AfterViewInit {
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

  zoomedImage: string | null = null;
  objectKeys = Object.keys;

  vistas = [
    { id: 'chart-lcc', nombre: 'L-CC', descripcion: 'Cráneo-Caudal Izquierda' },
    { id: 'chart-rcc', nombre: 'R-CC', descripcion: 'Cráneo-Caudal Derecha' },
    { id: 'chart-lmlo', nombre: 'L-MLO', descripcion: 'Oblicua Medio-Lateral Izquierda' },
    { id: 'chart-rmlo', nombre: 'R-MLO', descripcion: 'Oblicua Medio-Lateral Derecha' }
  ];

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
        const maximo = Math.max(...valores);
        birads = maximo.toString();
        const index = valores.indexOf(maximo);
        const clave = Object.keys(resultado)[index];
        const vistaTexto = this.mapVistaLabel(clave);
        resumen = `BI-RADS ${birads} (${vistaTexto})`;
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

  ngAfterViewInit(): void {
    if (this.datosReporte?.detalles) {
      this.renderizarGraficas();
    }
  }

  renderizarGraficas() {
    const colores = [
      'rgba(117, 251, 216, 1)', // BI-RADS 1
      'rgba(117, 251, 76, 1)',  // BI-RADS 2
      'rgba(254, 251, 83, 1)',  // BI-RADS 3
      'rgba(255, 102, 0, 1)',  // BI-RADS 4
      'rgba(234, 52, 37, 1)'    // BI-RADS 5
    ];

    const etiquetas = ['BI-RADS 1', 'BI-RADS 2', 'BI-RADS 3', 'BI-RADS 4', 'BI-RADS 5'];

    for (const vista of this.vistas) {
      const datosVista = this.datosReporte?.detalles?.[vista.nombre];
      const probs = datosVista?.probabilidades;
      if (!probs) continue;

      const ctx = document.getElementById(vista.id) as HTMLCanvasElement;
      if (!ctx) continue;

      new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: etiquetas,
          datasets: [{
            data: probs,
            backgroundColor: colores,
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                font: { size: 13 }
              }
            },
            tooltip: {
              callbacks: {
                label: function (context) {
                  const value = context.raw as number;
                  return `${context.label}: ${value.toFixed(2)}%`;
                }
              }
            }
          }
        }
      });
    }
  }

  mapVistaLabel(vista: string): string {
    switch (vista.toUpperCase()) {
      case 'L-CC': return 'Cráneo-Caudal Izquierda';
      case 'R-CC': return 'Cráneo-Caudal Derecha';
      case 'L-MLO': return 'Oblicua Medio-Lateral Izquierda';
      case 'R-MLO': return 'Oblicua Medio-Lateral Derecha';
      default: return vista;
    }
  }

  toggleZoom(vista?: string) {
    if (vista && this.datosReporte?.detalles?.[vista]) {
      this.zoomedImage = this.datosReporte.detalles[vista].image_url;
    } else {
      this.zoomedImage = null;
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
    const textoBase1 = 'Clasificación más alta: ';
    const textoBase2 = 'BI-RADS ' + this.datosReporte.birads;
    const textoVista = '(' + this.datosReporte.resumen.split('BI-RADS ' + this.datosReporte.birads)[1]?.replace('(', '').replace(')', '') + ')';

    doc.setFont('helvetica', 'bold');
    doc.text(textoBase1 + textoBase2, 20, y);

    const baseWidth = doc.getTextWidth(textoBase1 + textoBase2);
    doc.setFont('helvetica', 'italic');
    doc.text(textoVista, 20 + baseWidth + 1, y);

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

    y += 15;
    const observaciones = this.observacionesRadiologo || 'Sin observaciones añadidas.';
    const obsLines = doc.splitTextToSize(observaciones, 160);
    const obsHeight = obsLines.length * 7 + 10;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Observaciones del Radiólogo:', 25, y + 7);

    doc.rect(20, y, 170, obsHeight);
    doc.setFont('helvetica', 'normal');
    doc.text(obsLines, 25, y + 14);
    y += obsHeight;

    doc.save(`Reporte_${this.datosReporte.paciente}_${this.datosReporte.fecha}.pdf`);
  }

  volver() {
    this.router.navigate(['/results']);
  }
}
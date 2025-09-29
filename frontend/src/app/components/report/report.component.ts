import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { jsPDF } from 'jspdf';
import { Navbar } from "../../navbar/navbar";
import { Chart } from 'chart.js/auto';
import { VisorCornerstoneComponent } from '../upload/visor-cornerstone/visor-cornerstone.component';
@Component({
  standalone: true,
  selector: 'app-report',
  imports: [CommonModule, FormsModule, Navbar, VisorCornerstoneComponent],
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.scss']
})
export class ReportComponent implements AfterViewInit {
  observacionesRadiologo: string = '';
  get observacionesLimitadas(): string {
    return this.observacionesRadiologo.length > 900
      ? this.observacionesRadiologo.slice(0, 900) + '...'
      : this.observacionesRadiologo;
  }
  @ViewChild('reporte', { static: false }) reporteElement!: ElementRef;
  datosReporte: any = {
    birads: 'Sin clasificar',
    resumen: '',
    detalles: {}
  };
  objectKeys = Object.keys;
  visorActivo: boolean = false;
  imagenSeleccionada: string = '';
  vistaSeleccionada: string = '';
  vistas = [
    { id: 'chart-lcc', nombre: 'L-CC', descripcion: 'Cráneo-Caudal Izquierda' },
    { id: 'chart-rcc', nombre: 'R-CC', descripcion: 'Cráneo-Caudal Derecha' },
    { id: 'chart-lmlo', nombre: 'L-MLO', descripcion: 'Oblicua Medio-Lateral Izquierda' },
    { id: 'chart-rmlo', nombre: 'R-MLO', descripcion: 'Oblicua Medio-Lateral Derecha' }
  ];
  constructor(private router: Router) {
    let birads = 'Sin clasificar';
    let resumen = 'Sin resultados disponibles';
    let detalles = {};
    const stored = localStorage.getItem('birads_resultado');
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
      'rgba(117, 251, 216, 1)',
      'rgba(117, 251, 76, 1)',
      'rgba(254, 251, 83, 1)',
      'rgba(255, 102, 0, 1)',
      'rgba(234, 52, 37, 1)'
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
              display: false
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
      this.imagenSeleccionada = this.datosReporte.detalles[vista].image_url;
      this.vistaSeleccionada = vista;
      this.visorActivo = true;
    } else {
      this.imagenSeleccionada = '';
      this.vistaSeleccionada = '';
      this.visorActivo = false;
    }
  }
  cerrarVisor(event: { vista: string; dataUrl: string }) {
    const { vista, dataUrl } = event;

    // Cierra el visor
    this.visorActivo = false;
    this.imagenSeleccionada = '';
    this.vistaSeleccionada = '';
  }
    async descargarPDF() {
    const doc = new jsPDF();
    let y = 20;
    doc.setFontSize(30);
    doc.setFont('helvetica', 'bold');
    doc.text('Reporte de Análisis BI-RADS', 105, y, { align: 'center' });
    y += 10;

    // Leyenda BI-RADS
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Categoría', 25, y);
    doc.text('Interpretación breve', 80, y);
    y += 7;
    const leyenda = [
      ['BI-RADS 1', 'Negativo'],
      ['BI-RADS 2', 'Hallazgos benignos'],
      ['BI-RADS 3', 'Probablemente benigno (<2%)'],
      ['BI-RADS 4', 'Sospechoso, biopsia recomendada'],
      ['BI-RADS 5', 'Altamente sugestivo de malignidad']
    ];
    doc.setFont('helvetica', 'normal');
    for (let [categoria, descripcion] of leyenda) {
      doc.text(categoria, 25, y);
      doc.text(descripcion, 80, y);
      y += 7;
    }
    y += 10;
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(`BI-RADS Dominante: BI-RADS ${this.datosReporte.birads}`, 20, y);
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
        const porcentajeFormatted = d.confidence.toFixed(2).replace('.', ',');
        const resultText = `BI-RADS ${d.birads} (${porcentajeFormatted}%)`;
        doc.text(resultText, 30 + doc.getTextWidth(labelText), y, { baseline: 'top' });
        y += 8;
      }
    }
    y += 10;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    const observaciones = this.observacionesLimitadas || 'Sin observaciones añadidas.';
    const obsLines = doc.splitTextToSize(observaciones, 160);
    const obsHeight = obsLines.length * 7 + 10;
  
    const obsY = 285 - obsHeight - 5;
    doc.rect(20, obsY, 170, obsHeight);
    doc.setFont('helvetica', 'bold');
    doc.text('Observaciones del Radiólogo:', 25, obsY + 7);
    doc.setFont('helvetica', 'normal');
    doc.text(obsLines, 25, obsY + 14);
    

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(11);
    doc.text('Las imágenes procesadas junto a su análisis se mostrarán a continuación', 105, 285, { align: 'center' });
    doc.text('El sistema actúa como herramienta de apoyo para la toma de decisiones clínicas, no como diagnóstico definitivo.', 105, 292, { align: 'center' });
    if (this.datosReporte.detalles && Object.keys(this.datosReporte.detalles).length > 0) {
      y = 300; // Start new content below the text at 285
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
            doc.addPage();
            let pageY = 30;
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text(this.mapVistaLabel(vista), 105, pageY, { align: 'center' });
            pageY += 10;
            const imageWidth = 100;
            const imageHeight = 120;
            const imageX = (210 - imageWidth) / 2;
            doc.addImage(imgData, 'JPEG', imageX, pageY, imageWidth, imageHeight);
            pageY += imageHeight + 10;
            const chartCanvas = document.getElementById(`chart-${vista.toLowerCase().replace('-', '')}`) as HTMLCanvasElement;
            if (chartCanvas) {
              const chartImgData = chartCanvas.toDataURL('image/png');
              const chartWidth = 90;
              const chartHeight = 90;
              const chartX = (210 - chartWidth) / 2;
              doc.addImage(chartImgData, 'PNG', chartX, pageY, chartWidth, chartHeight);
            }
            resolve();
          };
          img.onerror = () => resolve();
        });
      }
    }
    const fecha = new Date();
    const timestamp = `${fecha.getFullYear()}-${(fecha.getMonth()+1).toString().padStart(2, '0')}-${fecha.getDate().toString().padStart(2, '0')}_${fecha.getHours().toString().padStart(2, '0')}-${fecha.getMinutes().toString().padStart(2, '0')}`;
    doc.save(`Reporte_BI-RADS_${timestamp}.pdf`);
  }
  volver() {
    this.router.navigate(['/results']);
  }
}

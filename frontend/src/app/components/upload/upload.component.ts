import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { BiradsService } from '../../services/birads.service';
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  selector: 'app-upload',
  imports: [CommonModule, FormsModule],
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.scss']
})
export class UploadComponent {
  imagenesSeleccionadas: { [key: string]: File } = {};
  imagenesKeys: string[] = [];

  nombrePaciente: string = '';
  documentoPaciente: string = '';
  fechaNacimiento: string = '';

  constructor(
    private router: Router,
    private biradsService: BiradsService
  ) {}

  onFilesSelected(event: any, tipo: string) {
    const archivo: File = event.target.files[0];
    if (archivo) {
      this.imagenesSeleccionadas[tipo] = archivo;
      this.imagenesKeys = Object.keys(this.imagenesSeleccionadas);
    }
  }

  analizarImagenes() {
    if (!this.nombrePaciente || !this.documentoPaciente || !this.fechaNacimiento || this.imagenesKeys.length === 0) {
      return;
    }

    const formData = new FormData();
    for (const key of this.imagenesKeys) {
      formData.append(key, this.imagenesSeleccionadas[key]);
    }

    localStorage.setItem('nombrePaciente', this.nombrePaciente);
    localStorage.setItem('documentoPaciente', this.documentoPaciente);
    localStorage.setItem('fechaNacimiento', this.fechaNacimiento);

    this.router.navigate(['/analysis']).then(() => {
      this.biradsService.analizarImagenes(formData).subscribe({
        next: (resultado: any) => {
          console.log('Resultado:', resultado);
          localStorage.setItem('birads_resultado', JSON.stringify(resultado));
          this.router.navigate(['/results']);
        },
        error: (err: any) => {
          console.error('Error al analizar las imágenes:', err);
          alert('Ocurrió un error durante el análisis. Intenta de nuevo.');
          this.router.navigate(['/upload']);
        }
      });
    });
  }

  volver() {
    this.router.navigate(['/']);
  }
}
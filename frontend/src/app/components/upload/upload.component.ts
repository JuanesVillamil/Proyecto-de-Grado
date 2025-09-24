import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { BiradsService } from '../../services/birads.service';
import { FormsModule } from '@angular/forms';
import { Navbar } from "../../navbar/navbar";

@Component({
  standalone: true,
  selector: 'app-upload',
  imports: [CommonModule, FormsModule, Navbar],
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.scss']
})
export class UploadComponent {
  imagenesSeleccionadas: { [key: string]: File } = {};
  imagenesKeys: string[] = [];

  nombrePaciente: string = '';
  documentoPaciente: string = '';
  fechaNacimiento: string = '';
  isProcessing: boolean = false;

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

    this.isProcessing = true;

    this.biradsService.analizarImagenes(formData).subscribe({
      next: (resultado: any) => {
        localStorage.setItem('birads_resultado', JSON.stringify(resultado));
        this.isProcessing = false;
        this.router.navigate(['/results']);
      },
      error: () => {
        this.isProcessing = false;
        alert('Ocurrió un error durante el análisis. Intenta de nuevo.');
      }
    });
  }
}

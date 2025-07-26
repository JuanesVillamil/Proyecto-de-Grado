import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-results',
  imports: [CommonModule],
  templateUrl: './results.component.html',
  styleUrls: ['./results.component.scss']
})
export class ResultsComponent {
  resultado: any = null;
  analisisExitoso: boolean = false;

  constructor(private router: Router) {
    const storedResult = localStorage.getItem('birads_resultado');
    if (storedResult) {
      this.resultado = JSON.parse(storedResult);
      this.analisisExitoso = true;
    } else {
      this.analisisExitoso = false;
    }
  }

  volver() {
    this.router.navigate(['/upload']); // Ir directamente a upload
  }

  generarReporte() {
    if (this.analisisExitoso) {
      this.router.navigate(['/report']);
    } else {
      this.router.navigate(['/upload']);
    }
  }
}
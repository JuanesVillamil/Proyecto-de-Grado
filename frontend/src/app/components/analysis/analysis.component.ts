import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-analysis',
  imports: [CommonModule],
  template: `
    <div class="analysis-container">
      <h2>Analizando imágenes...</h2>
      <p>Por favor espera mientras procesamos el análisis BI-RADS.</p>
      <div class="spinner"></div>
    </div>
  `,
  styles: [`
    .analysis-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 80vh;
      text-align: center;
      font-family: 'Helvetica Neue', sans-serif;
    }
    .spinner {
      border: 8px solid #f3f3f3;
      border-top: 8px solid #3498db;
      border-radius: 50%;
      width: 60px;
      height: 60px;
      animation: spin 1s linear infinite;
      margin-top: 20px;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `]
})
export class AnalysisComponent {}
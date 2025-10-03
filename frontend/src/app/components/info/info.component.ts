import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Navbar } from '../navbar/navbar';

@Component({
  selector: 'app-info',
  standalone: true,
  imports: [CommonModule, RouterModule, Navbar],
  templateUrl: './info.component.html',
})
export class InfoComponent {}
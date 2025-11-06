import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment'

@Injectable({
  providedIn: 'root'
})
export class BiradsService {
  private apiUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  analizarImagenes(formData: FormData): Observable<{
    
    [view: string]: { birads: number; confidence: number }
  }> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    
    return this.http.post<{
      [view: string]: { birads: number; confidence: number }
    }>(`${this.apiUrl}/predict`, formData, { headers }); 
  }
}
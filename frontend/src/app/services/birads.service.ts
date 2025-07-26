import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BiradsService {
  private apiUrl = 'http://127.0.0.1:8000/predict';

  constructor(private http: HttpClient) {}

  analizarImagenes(formData: FormData): Observable<{
    [view: string]: { birads: number; confidence: number }
  }> {
    return this.http.post<{
      [view: string]: { birads: number; confidence: number }
    }>(this.apiUrl, formData);
  }
}
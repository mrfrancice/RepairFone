import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Body / params transports tolerants : on accepte n'importe quel payload
 * serialisable JSON ou FormData. `unknown` plutot que `any` pour empecher
 * les acces non typés cote caller (le caller doit toujours typer
 * explicitement ce qu'il envoie).
 *
 * `ApiParams` reste large car les domaines passent leurs propres shapes
 * (RequestStatus[], filtres complexes, etc.) ; le filtrage des valeurs
 * non-serialisables a lieu dans cleanParams.
 */
type ApiBody = unknown;
type ApiParams = Record<string, unknown>;

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  get<T>(endpoint: string, params?: ApiParams): Observable<T> {
    const httpParams = params
      ? new HttpParams({ fromObject: this.cleanParams(params) })
      : undefined;

    return this.http.get<T>(`${this.baseUrl}${endpoint}`, { params: httpParams });
  }

  post<T>(endpoint: string, body: ApiBody): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${endpoint}`, body);
  }

  put<T>(endpoint: string, body: ApiBody): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}${endpoint}`, body);
  }

  patch<T>(endpoint: string, body: ApiBody): Observable<T> {
    return this.http.patch<T>(`${this.baseUrl}${endpoint}`, body);
  }

  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}${endpoint}`);
  }

  private cleanParams(params: ApiParams): Record<string, string> {
    const cleaned: Record<string, string> = {};
    for (const [key, value] of Object.entries(params)) {
      if (value !== null && value !== undefined && value !== '') {
        cleaned[key] = String(value);
      }
    }
    return cleaned;
  }
}

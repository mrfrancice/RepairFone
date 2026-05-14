import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ApiService } from './api.service';
import { environment } from '../../../environments/environment';

describe('ApiService', () => {
  let service: ApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ApiService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(ApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('GET prefixe avec environment.apiUrl', () => {
    service.get('/repairers').subscribe();
    const req = http.expectOne(`${environment.apiUrl}/repairers`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('GET serialise les params non-vides', () => {
    service.get('/repairers', { page: 1, limit: 10, q: '' }).subscribe();
    const req = http.expectOne((r) =>
      r.url === `${environment.apiUrl}/repairers` &&
      r.params.get('page') === '1' &&
      r.params.get('limit') === '10' &&
      !r.params.has('q'), // empty string filtré
    );
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('GET filtre les params null/undefined', () => {
    service.get('/x', { a: null, b: undefined, c: 0, d: false }).subscribe();
    const req = http.expectOne((r) => r.url === `${environment.apiUrl}/x`);
    expect(req.request.params.keys().sort()).toEqual(['c', 'd']);
    req.flush({});
  });

  it('POST envoie le body en JSON', () => {
    const body = { name: 'foo' };
    service.post('/items', body).subscribe();
    const req = http.expectOne(`${environment.apiUrl}/items`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush({ id: '1' });
  });

  it('PUT / PATCH / DELETE empruntent les bonnes méthodes HTTP', () => {
    service.put('/r/1', { a: 1 }).subscribe();
    const putReq = http.expectOne((r) => r.method === 'PUT' && r.url === `${environment.apiUrl}/r/1`);
    expect(putReq.request.body).toEqual({ a: 1 });
    putReq.flush({});

    service.patch('/r/1', { a: 2 }).subscribe();
    const patchReq = http.expectOne((r) => r.method === 'PATCH' && r.url === `${environment.apiUrl}/r/1`);
    expect(patchReq.request.body).toEqual({ a: 2 });
    patchReq.flush({});

    service.delete('/r/1').subscribe();
    const delReq = http.expectOne((r) => r.method === 'DELETE' && r.url === `${environment.apiUrl}/r/1`);
    expect(delReq.request.method).toBe('DELETE');
    delReq.flush({});
  });
});

---
name: repairfone-test-strategist
version: "2.0"
description: |
  Expert en tests pour RepairFone.
  Jasmine/Karma (Angular), Jest (NestJS).
  
  ## Quand utiliser
  - Création de tests unitaires
  - Tests d'intégration
  - Tests E2E
  - Configuration de coverage

model: opus
domain: quality
level: senior
stack: jasmine-jest
---

# Test Strategist - RepairFone

## MISSION

Expert en tests pour RepairFone. Vous créez des tests robustes pour Angular (Jasmine/Karma) et NestJS (Jest).

---

## TESTS ANGULAR

### Composant avec Signal

```typescript
// repair-card.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { RepairCardComponent } from './repair-card.component';
import { RepairService } from '@core/services/repair.service';

describe('RepairCardComponent', () => {
  let component: RepairCardComponent;
  let fixture: ComponentFixture<RepairCardComponent>;
  let mockRepairService: jasmine.SpyObj<RepairService>;

  const mockRepair = {
    id: '1',
    title: 'Écran cassé',
    status: 'pending',
    createdAt: new Date()
  };

  beforeEach(async () => {
    mockRepairService = jasmine.createSpyObj('RepairService', ['getById', 'update']);

    await TestBed.configureTestingModule({
      imports: [RepairCardComponent],
      providers: [
        { provide: RepairService, useValue: mockRepairService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RepairCardComponent);
    component = fixture.componentInstance;
    
    // Set required input
    fixture.componentRef.setInput('repair', mockRepair);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display repair title', () => {
    const titleElement = fixture.nativeElement.querySelector('.repair-title');
    expect(titleElement.textContent).toContain('Écran cassé');
  });

  it('should show loading state', () => {
    component.isLoading.set(true);
    fixture.detectChanges();
    
    const spinner = fixture.nativeElement.querySelector('mat-spinner');
    expect(spinner).toBeTruthy();
  });

  it('should emit onAction when button clicked', () => {
    spyOn(component.onAction, 'emit');
    
    const button = fixture.nativeElement.querySelector('button');
    button.click();
    
    expect(component.onAction.emit).toHaveBeenCalled();
  });
});
```

### Service avec HttpClient

```typescript
// repair.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RepairService } from './repair.service';
import { environment } from '@env/environment';

describe('RepairService', () => {
  let service: RepairService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [RepairService]
    });

    service = TestBed.inject(RepairService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch all repairs', () => {
    const mockRepairs = [
      { id: '1', title: 'Repair 1' },
      { id: '2', title: 'Repair 2' }
    ];

    service.getAll().subscribe(repairs => {
      expect(repairs.length).toBe(2);
      expect(repairs[0].title).toBe('Repair 1');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/repairs`);
    expect(req.request.method).toBe('GET');
    req.flush(mockRepairs);
  });

  it('should create a repair', () => {
    const newRepair = { title: 'New Repair', description: 'Test' };
    const createdRepair = { id: '3', ...newRepair };

    service.create(newRepair).subscribe(repair => {
      expect(repair.id).toBe('3');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/repairs`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newRepair);
    req.flush(createdRepair);
  });

  it('should handle errors', () => {
    service.getAll().subscribe({
      next: () => fail('should have failed'),
      error: (error) => {
        expect(error.status).toBe(500);
      }
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/repairs`);
    req.flush('Error', { status: 500, statusText: 'Server Error' });
  });
});
```

---

## TESTS NESTJS

### Service

```typescript
// repair.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RepairService } from './repair.service';
import { Repair } from './entities/repair.entity';
import { NotFoundException } from '@nestjs/common';

describe('RepairService', () => {
  let service: RepairService;
  let repository: jest.Mocked<Repository<Repair>>;

  const mockRepair = {
    id: '1',
    title: 'Test Repair',
    userId: 'user-1',
    status: 'pending',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RepairService,
        {
          provide: getRepositoryToken(Repair),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            delete: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RepairService>(RepairService);
    repository = module.get(getRepositoryToken(Repair));
  });

  describe('create', () => {
    it('should create a repair', async () => {
      const createDto = { title: 'New Repair' };
      repository.create.mockReturnValue(mockRepair as Repair);
      repository.save.mockResolvedValue(mockRepair as Repair);

      const result = await service.create('user-1', createDto);

      expect(repository.create).toHaveBeenCalledWith({
        ...createDto,
        userId: 'user-1',
      });
      expect(result.title).toBe('Test Repair');
    });
  });

  describe('findOne', () => {
    it('should return a repair', async () => {
      repository.findOne.mockResolvedValue(mockRepair as Repair);

      const result = await service.findOne('1');

      expect(result).toEqual(mockRepair);
    });

    it('should throw NotFoundException', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });
});
```

### Controller

```typescript
// repair.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { RepairController } from './repair.controller';
import { RepairService } from './repair.service';

describe('RepairController', () => {
  let controller: RepairController;
  let service: jest.Mocked<RepairService>;

  const mockUser = { id: 'user-1', email: 'test@test.com' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RepairController],
      providers: [
        {
          provide: RepairService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<RepairController>(RepairController);
    service = module.get(RepairService);
  });

  it('should create a repair', async () => {
    const createDto = { title: 'New Repair' };
    const expected = { id: '1', ...createDto };
    service.create.mockResolvedValue(expected as any);

    const result = await controller.create({ user: mockUser }, createDto);

    expect(service.create).toHaveBeenCalledWith('user-1', createDto);
    expect(result).toEqual(expected);
  });
});
```

### E2E

```typescript
// test/repair.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('RepairController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    // Get auth token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@test.com', password: 'password' });
    authToken = loginResponse.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/repairs (POST)', () => {
    it('should create a repair', () => {
      return request(app.getHttpServer())
        .post('/repairs')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'E2E Test Repair' })
        .expect(201)
        .expect((res) => {
          expect(res.body.title).toBe('E2E Test Repair');
        });
    });

    it('should reject without auth', () => {
      return request(app.getHttpServer())
        .post('/repairs')
        .send({ title: 'Test' })
        .expect(401);
    });
  });
});
```

---

## COVERAGE TARGETS

| Partie | Minimum | Cible |
|--------|---------|-------|
| Frontend Components | 70% | 85% |
| Frontend Services | 80% | 90% |
| Backend Services | 80% | 90% |
| Backend Controllers | 70% | 85% |
| Critical Paths | 100% | 100% |

---

## COMMANDES

```bash
# Frontend
npm run test              # Run tests
npm run test -- --coverage # Coverage

# Backend
npm run test              # Unit tests
npm run test:cov          # Coverage
npm run test:e2e          # E2E tests
```

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource, SelectQueryBuilder } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { RepairRequest, RequestStatus, DeliveryMode } from './entities/repair-request.entity';
import { RequestStatusHistory } from './entities/request-status-history.entity';
import { RepairerProfile } from '../users/entities/repairer-profile.entity';
import { Payment } from '../payments/entities/payment.entity';
import { CreateRequestDto, UpdateRequestStatusDto } from './dto';
import { User, UserRole, UserStatus } from '../users/entities/user.entity';

describe('RequestsService', () => {
  let service: RequestsService;
  let requestRepository: jest.Mocked<Repository<RepairRequest>>;
  let statusHistoryRepository: jest.Mocked<Repository<RequestStatusHistory>>;
  let repairerProfileRepository: jest.Mocked<Repository<RepairerProfile>>;
  let paymentRepository: jest.Mocked<Repository<Payment>>;
  let eventEmitter: jest.Mocked<EventEmitter2>;
  let dataSource: jest.Mocked<DataSource>;

  // Test fixtures
  const mockClient: User = {
    id: 'client-uuid-1',
    phone: '+2250700000001',
    passwordHash: 'hashed',
    role: UserRole.CLIENT,
    status: UserStatus.ACTIVE,
    firstName: 'Client',
    lastName: 'Test',
    isPhoneVerified: true,
    isEmailVerified: false,
    failedLoginAttempts: 0,
    preferredLanguage: 'fr',
    createdAt: new Date(),
    updatedAt: new Date(),
    get fullName() { return `${this.firstName} ${this.lastName}`; },
  } as User;

  const mockRepairerUser: User = {
    id: 'repairer-user-uuid-1',
    phone: '+2250700000002',
    passwordHash: 'hashed',
    role: UserRole.REPAIRER,
    status: UserStatus.ACTIVE,
    firstName: 'Repairer',
    lastName: 'Test',
    isPhoneVerified: true,
    isEmailVerified: false,
    failedLoginAttempts: 0,
    preferredLanguage: 'fr',
    createdAt: new Date(),
    updatedAt: new Date(),
    get fullName() { return `${this.firstName} ${this.lastName}`; },
  } as User;

  const mockRepairerProfile: RepairerProfile = {
    id: 'repairer-profile-uuid-1',
    userId: 'repairer-user-uuid-1',
    businessName: 'Test Repair Shop',
    description: 'Quality repairs',
    address: '123 Repair Street',
    city: 'Abidjan',
    latitude: 5.3484,
    longitude: -4.0055,
    ratingAvg: 4.5,
    ratingCount: 10,
    isAvailable: true,
    isVerified: true,
    isBlocked: false,
    specialties: ['phone', 'tablet'],
    user: mockRepairerUser,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as RepairerProfile;

  const mockRepairRequest: RepairRequest = {
    id: 'request-uuid-1',
    requestNumber: 'RF2501001',
    clientId: 'client-uuid-1',
    repairerId: 'repairer-profile-uuid-1',
    description: 'Screen repair needed',
    status: RequestStatus.PENDING,
    deliveryMode: DeliveryMode.IN_SHOP,
    images: [],
    currency: 'XOF',
    urgency: 'normal',
    client: mockClient,
    repairer: mockRepairerProfile,
    statusHistory: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  } as RepairRequest;

  const mockStatusHistory: RequestStatusHistory = {
    id: 'history-uuid-1',
    requestId: 'request-uuid-1',
    status: RequestStatus.PENDING,
    comment: 'Demande creee',
    changedBy: 'client-uuid-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as RequestStatusHistory;

  // Mock query builder
  const createMockQueryBuilder = (result: any): Partial<SelectQueryBuilder<RepairRequest>> => ({
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(result),
    getManyAndCount: jest.fn().mockResolvedValue([result ? [result] : [], result ? 1 : 0]),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue([]),
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequestsService,
        {
          provide: getRepositoryToken(RepairRequest),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(RequestStatusHistory),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(RepairerProfile),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Payment),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            query: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RequestsService>(RequestsService);
    requestRepository = module.get(getRepositoryToken(RepairRequest));
    statusHistoryRepository = module.get(getRepositoryToken(RequestStatusHistory));
    repairerProfileRepository = module.get(getRepositoryToken(RepairerProfile));
    paymentRepository = module.get(getRepositoryToken(Payment));
    eventEmitter = module.get(EventEmitter2);
    dataSource = module.get(DataSource);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ============================================
  // CREATE REQUEST TESTS
  // ============================================
  describe('createRequest', () => {
    const clientId = 'client-uuid-1';
    const createDto: CreateRequestDto = {
      repairerId: 'repairer-profile-uuid-1',
      description: 'Screen repair needed',
      deliveryMode: DeliveryMode.IN_SHOP,
    };

    it('should create a repair request successfully', async () => {
      // Arrange
      repairerProfileRepository.findOne.mockResolvedValue(mockRepairerProfile);
      dataSource.query.mockResolvedValue([{ seq_value: 1 }]);
      requestRepository.create.mockReturnValue(mockRepairRequest);
      requestRepository.save.mockResolvedValue(mockRepairRequest);
      statusHistoryRepository.create.mockReturnValue(mockStatusHistory);
      statusHistoryRepository.save.mockResolvedValue(mockStatusHistory);

      const mockQueryBuilder = createMockQueryBuilder(mockRepairRequest);
      requestRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      // Act
      const result = await service.createRequest(clientId, createDto);

      // Assert
      expect(result).toBeDefined();
      expect(result.requestNumber).toBeDefined();
      expect(requestRepository.create).toHaveBeenCalled();
      expect(requestRepository.save).toHaveBeenCalled();
      expect(statusHistoryRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: RequestStatus.PENDING,
          comment: 'Demande creee',
        }),
      );
    });

    it('should find repairer profile by userId if not found by id', async () => {
      // Arrange
      const createDtoWithUserId: CreateRequestDto = {
        ...createDto,
        repairerId: 'repairer-user-uuid-1', // User ID instead of profile ID
      };

      // First call returns null (not found by profile ID), second returns the profile
      repairerProfileRepository.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockRepairerProfile);
      dataSource.query.mockResolvedValue([{ seq_value: 1 }]);
      requestRepository.create.mockReturnValue(mockRepairRequest);
      requestRepository.save.mockResolvedValue(mockRepairRequest);
      statusHistoryRepository.create.mockReturnValue(mockStatusHistory);
      statusHistoryRepository.save.mockResolvedValue(mockStatusHistory);

      const mockQueryBuilder = createMockQueryBuilder(mockRepairRequest);
      requestRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      // Act
      const result = await service.createRequest(clientId, createDtoWithUserId);

      // Assert
      expect(repairerProfileRepository.findOne).toHaveBeenCalledTimes(2);
      expect(result).toBeDefined();
    });

    it('should throw BadRequestException if repairer not found', async () => {
      // Arrange
      repairerProfileRepository.findOne.mockResolvedValue(null);
      dataSource.query.mockResolvedValue([{ seq_value: 1 }]);

      // Act & Assert
      await expect(service.createRequest(clientId, createDto)).rejects.toThrow(BadRequestException);
      await expect(service.createRequest(clientId, createDto)).rejects.toThrow('Réparateur non trouvé');
    });

    it('should create request with all optional fields', async () => {
      // Arrange
      const fullCreateDto: CreateRequestDto = {
        ...createDto,
        deviceId: 'device-uuid-1',
        serviceTypeId: 'service-uuid-1',
        preferredDate: '2025-02-01',
        preferredTime: '10:00',
        clientLatitude: 5.3484,
        clientLongitude: -4.0055,
        clientAddress: '123 Client Street',
        images: ['image1.jpg', 'image2.jpg'],
        urgency: 'express',
      };

      repairerProfileRepository.findOne.mockResolvedValue(mockRepairerProfile);
      dataSource.query.mockResolvedValue([{ seq_value: 2 }]);
      requestRepository.create.mockReturnValue({ ...mockRepairRequest, ...fullCreateDto } as RepairRequest);
      requestRepository.save.mockResolvedValue({ ...mockRepairRequest, ...fullCreateDto } as RepairRequest);
      statusHistoryRepository.create.mockReturnValue(mockStatusHistory);
      statusHistoryRepository.save.mockResolvedValue(mockStatusHistory);

      const mockQueryBuilder = createMockQueryBuilder({ ...mockRepairRequest, ...fullCreateDto });
      requestRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      // Act
      const result = await service.createRequest(clientId, fullCreateDto);

      // Assert
      expect(requestRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          deviceId: fullCreateDto.deviceId,
          serviceTypeId: fullCreateDto.serviceTypeId,
          urgency: 'express',
        }),
      );
    });
  });

  // ============================================
  // FIND ONE TESTS
  // ============================================
  describe('findOne', () => {
    it('should return a request by id', async () => {
      // Arrange
      const mockQueryBuilder = createMockQueryBuilder(mockRepairRequest);
      requestRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      // Act
      const result = await service.findOne('request-uuid-1');

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(mockRepairRequest.id);
    });

    it('should throw NotFoundException if request not found', async () => {
      // Arrange
      const mockQueryBuilder = createMockQueryBuilder(null);
      requestRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      // Act & Assert
      await expect(service.findOne('non-existent-uuid')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('non-existent-uuid')).rejects.toThrow('Demande de réparation non trouvée');
    });
  });

  // ============================================
  // FIND BY CLIENT TESTS
  // ============================================
  describe('findByClient', () => {
    it('should return paginated requests for a client', async () => {
      // Arrange
      const mockQueryBuilder = createMockQueryBuilder(mockRepairRequest);
      requestRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      // Act
      const result = await service.findByClient('client-uuid-1', { page: 1, limit: 20 });

      // Assert
      expect(result.data).toBeDefined();
      expect(result.total).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should filter by status', async () => {
      // Arrange
      const mockQueryBuilder = createMockQueryBuilder(mockRepairRequest);
      requestRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      // Act
      await service.findByClient('client-uuid-1', { status: 'pending', page: 1, limit: 20 });

      // Assert
      expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
    });

    it('should filter by multiple statuses', async () => {
      // Arrange
      const mockQueryBuilder = createMockQueryBuilder(mockRepairRequest);
      requestRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      // Act
      await service.findByClient('client-uuid-1', { status: 'pending,accepted', page: 1, limit: 20 });

      // Assert
      expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
    });

    it('should handle pagination correctly', async () => {
      // Arrange
      const mockQueryBuilder = createMockQueryBuilder(mockRepairRequest);
      requestRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      // Act
      await service.findByClient('client-uuid-1', { page: 2, limit: 10 });

      // Assert
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(10); // (2-1) * 10
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
    });
  });

  // ============================================
  // FIND BY REPAIRER TESTS
  // ============================================
  describe('findByRepairer', () => {
    it('should return paginated requests for a repairer', async () => {
      // Arrange
      repairerProfileRepository.findOne.mockResolvedValue(mockRepairerProfile);
      const mockQueryBuilder = createMockQueryBuilder(mockRepairRequest);
      requestRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      // Act
      const result = await service.findByRepairer('repairer-user-uuid-1', { page: 1, limit: 20 });

      // Assert
      expect(result.data).toBeDefined();
      expect(result.total).toBeDefined();
    });

    it('should return empty result if repairer profile not found', async () => {
      // Arrange
      repairerProfileRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await service.findByRepairer('non-existent-uuid', { page: 1, limit: 20 });

      // Assert
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  // ============================================
  // UPDATE STATUS TESTS
  // ============================================
  describe('updateStatus', () => {
    const requestId = 'request-uuid-1';
    const userId = 'repairer-user-uuid-1';

    beforeEach(() => {
      // Setup for successful findOneEntity and findOne calls
      const mockQueryBuilder = createMockQueryBuilder(mockRepairRequest);
      requestRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);
    });

    it('should update request status successfully (repairer accepts)', async () => {
      // Arrange
      const pendingRequest = { ...mockRepairRequest, status: RequestStatus.PENDING };
      const mockQueryBuilder = createMockQueryBuilder(pendingRequest);
      requestRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);
      // BIZ-102: Mock repairer profile for permission check
      repairerProfileRepository.findOne.mockResolvedValue(mockRepairerProfile);

      const updateDto: UpdateRequestStatusDto = {
        status: RequestStatus.ACCEPTED,
        comment: 'Request accepted',
      };
      requestRepository.save.mockResolvedValue({ ...pendingRequest, status: RequestStatus.ACCEPTED });
      statusHistoryRepository.create.mockReturnValue(mockStatusHistory);
      statusHistoryRepository.save.mockResolvedValue(mockStatusHistory);

      // Act
      const result = await service.updateStatus(requestId, userId, 'repairer', updateDto);

      // Assert
      expect(requestRepository.save).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if client tries to access another client request', async () => {
      // Arrange
      const mockQueryBuilder = createMockQueryBuilder(mockRepairRequest);
      requestRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const updateDto: UpdateRequestStatusDto = {
        status: RequestStatus.CANCELLED,
      };

      // Act & Assert
      await expect(
        service.updateStatus(requestId, 'different-client-uuid', 'client', updateDto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if repairer tries to access another repairer request', async () => {
      // Arrange
      const mockQueryBuilder = createMockQueryBuilder(mockRepairRequest);
      requestRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const updateDto: UpdateRequestStatusDto = {
        status: RequestStatus.ACCEPTED,
      };

      // Act & Assert
      await expect(
        service.updateStatus(requestId, 'different-repairer-uuid', 'repairer', updateDto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException for invalid status transition', async () => {
      // Arrange
      const completedRequest = { ...mockRepairRequest, status: RequestStatus.COMPLETED };
      const mockQueryBuilder = createMockQueryBuilder(completedRequest);
      requestRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);
      // BIZ-102: Mock repairer profile for permission check
      repairerProfileRepository.findOne.mockResolvedValue(mockRepairerProfile);

      const updateDto: UpdateRequestStatusDto = {
        status: RequestStatus.PENDING, // Invalid: COMPLETED -> PENDING
      };

      // Act & Assert
      await expect(
        service.updateStatus(requestId, userId, 'repairer', updateDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should require rejectionReason when rejecting', async () => {
      // Arrange
      const pendingRequest = { ...mockRepairRequest, status: RequestStatus.PENDING };
      const mockQueryBuilder = createMockQueryBuilder(pendingRequest);
      requestRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);
      // BIZ-102: Mock repairer profile for permission check
      repairerProfileRepository.findOne.mockResolvedValue(mockRepairerProfile);

      const updateDto: UpdateRequestStatusDto = {
        status: RequestStatus.REJECTED,
        // Missing rejectionReason
      };

      // Act & Assert
      await expect(
        service.updateStatus(requestId, userId, 'repairer', updateDto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.updateStatus(requestId, userId, 'repairer', updateDto),
      ).rejects.toThrow('Le motif de rejet est obligatoire');
    });

    it('should allow client to cancel pending request', async () => {
      // Arrange
      const pendingRequest = { ...mockRepairRequest, status: RequestStatus.PENDING };
      const mockQueryBuilder = createMockQueryBuilder(pendingRequest);
      requestRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const updateDto: UpdateRequestStatusDto = {
        status: RequestStatus.CANCELLED,
        comment: 'Client cancelled',
      };
      requestRepository.save.mockResolvedValue({ ...pendingRequest, status: RequestStatus.CANCELLED });
      statusHistoryRepository.create.mockReturnValue(mockStatusHistory);
      statusHistoryRepository.save.mockResolvedValue(mockStatusHistory);

      // Act
      const result = await service.updateStatus(requestId, 'client-uuid-1', 'client', updateDto);

      // Assert
      expect(requestRepository.save).toHaveBeenCalled();
    });

    it('should set acceptedAt when accepting request', async () => {
      // Arrange
      const pendingRequest = { ...mockRepairRequest, status: RequestStatus.PENDING };
      const mockQueryBuilder = createMockQueryBuilder(pendingRequest);
      requestRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);
      // BIZ-102: Mock repairer profile for permission check
      repairerProfileRepository.findOne.mockResolvedValue(mockRepairerProfile);

      const updateDto: UpdateRequestStatusDto = {
        status: RequestStatus.ACCEPTED,
      };
      requestRepository.save.mockImplementation((req) => Promise.resolve(req as RepairRequest));
      statusHistoryRepository.create.mockReturnValue(mockStatusHistory);
      statusHistoryRepository.save.mockResolvedValue(mockStatusHistory);

      // Act
      await service.updateStatus(requestId, userId, 'repairer', updateDto);

      // Assert
      expect(requestRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          acceptedAt: expect.any(Date),
        }),
      );
    });

    it('should set rejectedAt and rejectionReason when rejecting', async () => {
      // Arrange
      const pendingRequest = { ...mockRepairRequest, status: RequestStatus.PENDING };
      const mockQueryBuilder = createMockQueryBuilder(pendingRequest);
      requestRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);
      // BIZ-102: Mock repairer profile for permission check
      repairerProfileRepository.findOne.mockResolvedValue(mockRepairerProfile);

      const updateDto: UpdateRequestStatusDto = {
        status: RequestStatus.REJECTED,
        rejectionReason: 'Cannot repair this device',
      };
      requestRepository.save.mockImplementation((req) => Promise.resolve(req as RepairRequest));
      statusHistoryRepository.create.mockReturnValue(mockStatusHistory);
      statusHistoryRepository.save.mockResolvedValue(mockStatusHistory);

      // Act
      await service.updateStatus(requestId, userId, 'repairer', updateDto);

      // Assert
      expect(requestRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          rejectedAt: expect.any(Date),
          rejectionReason: 'Cannot repair this device',
        }),
      );
    });

    it('should set completedAt when completing request', async () => {
      // Arrange
      const inProgressRequest = { ...mockRepairRequest, status: RequestStatus.IN_PROGRESS };
      const mockQueryBuilder = createMockQueryBuilder(inProgressRequest);
      requestRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);
      // BIZ-102: Mock repairer profile for permission check
      repairerProfileRepository.findOne.mockResolvedValue(mockRepairerProfile);

      const updateDto: UpdateRequestStatusDto = {
        status: RequestStatus.COMPLETED,
      };
      requestRepository.save.mockImplementation((req) => Promise.resolve(req as RepairRequest));
      statusHistoryRepository.create.mockReturnValue(mockStatusHistory);
      statusHistoryRepository.save.mockResolvedValue(mockStatusHistory);

      // Act
      await service.updateStatus(requestId, userId, 'repairer', updateDto);

      // Assert
      expect(requestRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          completedAt: expect.any(Date),
        }),
      );
    });
  });

  // ============================================
  // GET REQUEST STATS TESTS
  // ============================================
  describe('getRequestStats', () => {
    it('should return stats for a client', async () => {
      // Arrange
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { status: 'pending', count: '5' },
          { status: 'completed', count: '10' },
        ]),
      };
      requestRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      // Act
      const result = await service.getRequestStats('client-uuid-1', 'client');

      // Assert
      expect(result.pending).toBe(5);
      expect(result.completed).toBe(10);
      expect(result.total).toBe(15);
    });

    it('should return stats for a repairer', async () => {
      // Arrange
      repairerProfileRepository.findOne.mockResolvedValue(mockRepairerProfile);
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { status: 'pending', count: '3' },
          { status: 'accepted', count: '2' },
          { status: 'completed', count: '8' },
        ]),
      };
      requestRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      // Act
      const result = await service.getRequestStats('repairer-user-uuid-1', 'repairer');

      // Assert
      expect(result.pending).toBe(3);
      expect(result.accepted).toBe(2);
      expect(result.completed).toBe(8);
      expect(result.total).toBe(13);
    });

    it('should return empty stats if repairer profile not found', async () => {
      // Arrange
      repairerProfileRepository.findOne.mockResolvedValue(null);
      // Query builder is created before profile check, so we need to mock it
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      };
      requestRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      // Act
      const result = await service.getRequestStats('non-existent-uuid', 'repairer');

      // Assert
      expect(result.total).toBe(0);
      expect(result.pending).toBe(0);
      expect(result.completed).toBe(0);
    });
  });

  // ============================================
  // STATUS TRANSITION VALIDATION TESTS
  // ============================================
  describe('Status Transitions', () => {
    const testStatusTransition = async (
      fromStatus: RequestStatus,
      toStatus: RequestStatus,
      role: string,
      shouldSucceed: boolean,
    ) => {
      // Arrange
      const request = { ...mockRepairRequest, status: fromStatus };
      const mockQueryBuilder = createMockQueryBuilder(request);
      requestRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const updateDto: UpdateRequestStatusDto = {
        status: toStatus,
        ...(toStatus === RequestStatus.REJECTED ? { rejectionReason: 'Test reason' } : {}),
      };

      // Determine the correct userId based on role
      const userId = role === 'client' ? 'client-uuid-1' : 'repairer-user-uuid-1';

      // BIZ-102: Mock repairerProfile for repairer role (required for permission check)
      if (role === 'repairer') {
        repairerProfileRepository.findOne.mockResolvedValue(mockRepairerProfile);
      }

      // Mock payment for ACCEPTED -> IN_PROGRESS transition (payment required)
      if (fromStatus === RequestStatus.ACCEPTED && toStatus === RequestStatus.IN_PROGRESS) {
        paymentRepository.findOne.mockResolvedValue({ id: 'payment-1', status: 'completed' } as any);
      }

      if (shouldSucceed) {
        requestRepository.save.mockResolvedValue({ ...request, status: toStatus });
        statusHistoryRepository.create.mockReturnValue(mockStatusHistory);
        statusHistoryRepository.save.mockResolvedValue(mockStatusHistory);

        // Act & Assert
        await expect(
          service.updateStatus('request-uuid-1', userId, role, updateDto),
        ).resolves.toBeDefined();
      } else {
        // Act & Assert
        await expect(
          service.updateStatus('request-uuid-1', userId, role, updateDto),
        ).rejects.toThrow(BadRequestException);
      }
    };

    it('PENDING -> ACCEPTED (repairer): should succeed', async () => {
      await testStatusTransition(RequestStatus.PENDING, RequestStatus.ACCEPTED, 'repairer', true);
    });

    it('PENDING -> REJECTED (repairer): should succeed', async () => {
      await testStatusTransition(RequestStatus.PENDING, RequestStatus.REJECTED, 'repairer', true);
    });

    it('PENDING -> CANCELLED (client): should succeed', async () => {
      await testStatusTransition(RequestStatus.PENDING, RequestStatus.CANCELLED, 'client', true);
    });

    it('PENDING -> IN_PROGRESS (repairer): should fail', async () => {
      await testStatusTransition(RequestStatus.PENDING, RequestStatus.IN_PROGRESS, 'repairer', false);
    });

    it('ACCEPTED -> IN_PROGRESS (repairer): should succeed', async () => {
      await testStatusTransition(RequestStatus.ACCEPTED, RequestStatus.IN_PROGRESS, 'repairer', true);
    });

    // BIZ-111: ACCEPTED -> COMPLETED direct est maintenant interdit (doit passer par IN_PROGRESS)
    it('ACCEPTED -> COMPLETED (repairer): should fail', async () => {
      await testStatusTransition(RequestStatus.ACCEPTED, RequestStatus.COMPLETED, 'repairer', false);
    });

    it('ACCEPTED -> DISPUTED (client): should succeed', async () => {
      await testStatusTransition(RequestStatus.ACCEPTED, RequestStatus.DISPUTED, 'client', true);
    });

    it('IN_PROGRESS -> COMPLETED (repairer): should succeed', async () => {
      await testStatusTransition(RequestStatus.IN_PROGRESS, RequestStatus.COMPLETED, 'repairer', true);
    });

    it('IN_PROGRESS -> AWAITING_PARTS (repairer): should succeed', async () => {
      await testStatusTransition(RequestStatus.IN_PROGRESS, RequestStatus.AWAITING_PARTS, 'repairer', true);
    });

    it('COMPLETED -> DELIVERED (repairer): should succeed', async () => {
      await testStatusTransition(RequestStatus.COMPLETED, RequestStatus.DELIVERED, 'repairer', true);
    });

    it('COMPLETED -> DISPUTED (client): should succeed', async () => {
      await testStatusTransition(RequestStatus.COMPLETED, RequestStatus.DISPUTED, 'client', true);
    });

    it('REJECTED -> any: should fail (final status)', async () => {
      await testStatusTransition(RequestStatus.REJECTED, RequestStatus.PENDING, 'repairer', false);
    });

    it('CANCELLED -> any: should fail (final status)', async () => {
      await testStatusTransition(RequestStatus.CANCELLED, RequestStatus.PENDING, 'client', false);
    });
  });
});

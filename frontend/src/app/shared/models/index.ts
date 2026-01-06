// ============================================
// INTERFACES ET MODÈLES PARTAGÉS - REPAIRFONE
// ============================================

// === USER & AUTH ===
export interface User {
  id: string;
  phone: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  avatarUrl?: string;
  role: UserRole;
  status: UserStatus;
  isPhoneVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'client' | 'repairer' | 'admin';
export type UserStatus = 'active' | 'suspended' | 'deleted';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginRequest {
  phone: string;
  password: string;
}

export interface RegisterRequest {
  phone: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
}

export interface OtpVerifyRequest {
  phone: string;
  code: string;
}

// === REPAIRER ===
export interface RepairerProfile {
  id: string;
  userId: string;
  businessName: string;
  description?: string;
  address: string;
  city: string;
  commune?: string;
  latitude?: number;
  longitude?: number;
  verificationStatus: VerificationStatus;
  verifiedAt?: string;
  certifications: any[];
  workingHours: WorkingHours;
  rating: number;
  ratingAvg: number;
  ratingCount: number;
  reviewCount: number;
  totalRepairs: number;
  completionRate: number;
  acceptsHomeService: boolean;
  homeServiceRadiusKm: number;
  isAvailable: boolean;
  specialties?: string[];
  // Additional properties for UI display
  isVerified?: boolean;
  responseTime?: number;
  estimatedPrice?: number;
  estimatedPriceMin?: number;
  estimatedPriceMax?: number;
  photos?: string[];
  galleryImages?: string[];
  badges?: RepairerBadge[];
  phone?: string;
  avatarUrl?: string;
  distance?: number;
  completedRepairs?: number;
  yearsOfExperience?: number;
  acceptanceRate?: number;
  serviceRadius?: number;
}

export type VerificationStatus = 'pending' | 'under_review' | 'verified' | 'rejected' | 'suspended';

export interface WorkingHours {
  [day: string]: { open: string; close: string; closed?: boolean };
}

export interface Repairer extends User {
  repairerProfile: RepairerProfile;
  distance?: number;
}

// === DEVICE ===
export interface Device {
  id: string;
  brand: string;
  model: string;
  category: DeviceCategory;
  imageUrl?: string;
  releaseYear?: number;
  isActive: boolean;
  serviceTypes?: ServiceType[];
}

export type DeviceCategory = 'smartphone' | 'tablet' | 'laptop' | 'computer' | 'smartwatch' | 'other';

export interface ServiceType {
  id: string;
  deviceId: string;
  name: string;
  description?: string;
  basePrice: number;
  estimatedDuration?: number;
  isActive: boolean;
}

// === REPAIR REQUEST ===
export interface RepairRequest {
  id: string;
  requestNumber: string;
  clientId: string;
  client?: User;
  repairerId?: string;
  repairer?: Repairer;
  deviceId?: string;
  device?: Device;
  serviceTypeId?: string;
  serviceType?: ServiceType;
  status: RequestStatus;
  deliveryMode: DeliveryMode;
  description: string;
  deviceBrand?: string;
  deviceModel?: string;
  deviceSerialNumber?: string;
  images: string[];
  estimatedPrice?: number;
  finalPrice?: number;
  currency: string;
  preferredDate?: string;
  preferredTime?: string;
  scheduledAt?: string;
  serviceAddress?: string;
  clientLatitude?: number;
  clientLongitude?: number;
  clientAddress?: string;
  estimatedDuration?: number;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  cancellationReason?: string;
  statusHistory?: RequestStatusHistory[];
  createdAt: string;
  updatedAt: string;
}

export type RequestStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'in_progress'
  | 'awaiting_parts'
  | 'completed'
  | 'delivered'
  | 'cancelled'
  | 'disputed';

export type DeliveryMode = 'in_shop' | 'at_home' | 'postal';

export interface RequestStatusHistory {
  id: string;
  requestId: string;
  status: RequestStatus;
  comment?: string;
  changedBy: string;
  createdAt: string;
}

export interface CreateRequestDto {
  repairerId: string;
  deviceId?: string;
  serviceTypeId?: string;
  description: string;
  deviceBrand?: string;
  deviceModel?: string;
  preferredDate?: string;
  preferredTime?: string;
  deliveryMode?: DeliveryMode;
  clientLatitude?: number;
  clientLongitude?: number;
  clientAddress?: string;
  images?: string[];
}

export interface UpdateRequestStatusDto {
  status: RequestStatus;
  comment?: string;
  estimatedPrice?: number;
  estimatedDuration?: number;
}

// === REVIEW ===
export interface Review {
  id: string;
  requestId: string;
  request?: RepairRequest;
  clientId: string;
  client?: User;
  repairerId: string;
  repairer?: RepairerProfile;
  rating: number;
  qualityRating?: number;
  communicationRating?: number;
  timelinessRating?: number;
  comment?: string;
  response?: string;
  responseAt?: string;
  isVisible: boolean;
  createdAt: string;
}

export interface CreateReviewDto {
  requestId: string;
  rating: number;
  qualityRating?: number;
  communicationRating?: number;
  timelinessRating?: number;
  comment?: string;
}

// === API RESPONSES ===
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
}

// === SEARCH ===
export interface SearchParams {
  latitude: number;
  longitude: number;
  radiusKm?: number;
  deviceId?: string;
  serviceTypeId?: string;
  minRating?: number;
  page?: number;
  limit?: number;
}

export interface DeviceSearchParams {
  brand?: string;
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// === NOTIFICATIONS ===
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
}

export type NotificationType =
  | 'request_created'
  | 'request_accepted'
  | 'request_rejected'
  | 'request_completed'
  | 'new_review'
  | 'system';

// === QUOTE (DEVIS) ===
export interface Quote {
  id: string;
  requestId: string;
  request?: RepairRequest;
  repairerId: string;
  repairer?: Repairer;
  status: QuoteStatus;
  laborCost: number;
  partsCost: number;
  additionalCost?: number;
  totalAmount: number;
  currency: string;
  estimatedDuration: number;
  estimatedCompletionDate?: string;
  partsDetails?: QuotePart[];
  notes?: string;
  validUntil: string;
  acceptedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export type QuoteStatus = 'pending' | 'accepted' | 'rejected' | 'expired' | 'revised';

export interface QuotePart {
  name: string;
  description?: string;
  price: number;
  quantity: number;
}

export interface CreateQuoteDto {
  requestId: string;
  laborCost: number;
  partsCost: number;
  additionalCost?: number;
  estimatedDuration: number;
  estimatedCompletionDate?: string;
  partsDetails?: QuotePart[];
  notes?: string;
  validDays?: number;
}

// === PAYMENT ===
export interface Payment {
  id: string;
  requestId: string;
  request?: RepairRequest;
  quoteId?: string;
  quote?: Quote;
  clientId: string;
  repairerId: string;
  amount: number;
  platformFee: number;
  repairerAmount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionRef?: string;
  providerRef?: string;
  depositAmount?: number;
  balanceAmount?: number;
  paidAt?: string;
  refundedAt?: string;
  refundReason?: string;
  blockedReason?: string;
  createdAt: string;
  updatedAt: string;
}

export type PaymentMethod = 'orange_money' | 'mtn_money' | 'wave' | 'cash' | 'card';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'blocked' | 'cancelled';

export interface CreatePaymentDto {
  requestId: string;
  quoteId?: string;
  amount: number;
  method: PaymentMethod;
  isDeposit?: boolean;
}

export interface PaymentInitResponse {
  paymentId: string;
  redirectUrl?: string;
  ussdCode?: string;
  instructions?: string;
}

// === DISPUTE (LITIGE) ===
export interface Dispute {
  id: string;
  requestId: string;
  request?: RepairRequest;
  paymentId?: string;
  payment?: Payment;
  openedBy: string;
  openedByUser?: User;
  reason: DisputeReason;
  description: string;
  status: DisputeStatus;
  evidences: DisputeEvidence[];
  resolution?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  refundAmount?: number;
  createdAt: string;
  updatedAt: string;
}

export type DisputeReason =
  | 'non_conforming_repair'
  | 'incomplete_repair'
  | 'delay'
  | 'price_mismatch'
  | 'damaged_device'
  | 'communication_issue'
  | 'other';

export type DisputeStatus = 'open' | 'under_review' | 'resolved' | 'closed' | 'escalated';

export interface DisputeEvidence {
  id: string;
  type: 'image' | 'document' | 'text';
  url?: string;
  content?: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface CreateDisputeDto {
  requestId: string;
  reason: DisputeReason;
  description: string;
  evidences?: File[];
}

// === CHAT ===
export interface ChatConversation {
  id: string;
  requestId: string;
  request?: RepairRequest;
  participants: ChatParticipant[];
  lastMessage?: ChatMessage;
  unreadCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChatParticipant {
  userId: string;
  user?: User;
  role: 'client' | 'repairer';
  joinedAt: string;
  lastSeenAt?: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderType?: 'client' | 'repairer';
  sender?: User;
  type: ChatMessageType;
  content: string;
  imageUrl?: string;
  metadata?: Record<string, any>;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export type ChatMessageType = 'text' | 'image' | 'system' | 'quote' | 'payment';

export interface SendMessageDto {
  conversationId: string;
  content: string;
  type?: ChatMessageType;
  image?: File;
}

// === CONSEILS (ADVICE) ===
export interface ConseilRequest {
  id: string;
  clientId: string;
  client?: User;
  expertId?: string;
  expert?: Repairer;
  type: ConseilType;
  format: ConseilFormat;
  topic: string;
  description: string;
  status: ConseilStatus;
  scheduledAt?: string;
  completedAt?: string;
  rating?: number;
  feedback?: string;
  price?: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export type ConseilType = 'diagnostic' | 'software' | 'purchase' | 'maintenance';
export type ConseilFormat = 'chat' | 'call' | 'video';
export type ConseilStatus = 'pending' | 'matched' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export interface CreateConseilDto {
  type: ConseilType;
  format: ConseilFormat;
  topic: string;
  description: string;
  preferredDate?: string;
  preferredTime?: string;
}

// === URGENCY ===
export type UrgencyLevel = 'normal' | 'express';

export interface UrgencyOption {
  level: UrgencyLevel;
  label: string;
  description: string;
  additionalFee?: number;
  estimatedTime?: string;
}

// === ONBOARDING ===
export interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  icon?: string;
  image?: string;
}

// === REPAIRER DASHBOARD ===
export interface RepairerStats {
  newRequests: number;
  activeRequests: number;
  completedToday: number;
  completedThisMonth: number;
  totalRevenue: number;
  monthlyRevenue: number;
  averageRating: number;
  responseRate: number;
  completionRate: number;
  qualityScore: number;
}

export interface RepairerBadge {
  id: string;
  type: BadgeType;
  label: string;
  icon: string;
  earnedAt: string;
}

export type BadgeType = 'verified' | 'fast_response' | 'top_rated' | 'expert' | 'trusted';

// === KYC (VERIFICATION) ===
export interface KycDocument {
  id: string;
  userId: string;
  type: KycDocumentType;
  fileUrl: string;
  status: KycDocumentStatus;
  rejectionReason?: string;
  verifiedAt?: string;
  createdAt: string;
}

export type KycDocumentType = 'identity_card' | 'business_license' | 'certificate' | 'photo' | 'other';
export type KycDocumentStatus = 'pending' | 'approved' | 'rejected';

// === RECEIPT / PROOF ===
export interface DepositReceipt {
  id: string;
  requestId: string;
  receiptNumber: string;
  deviceDescription: string;
  deviceCondition: string;
  accessories?: string[];
  clientSignature?: string;
  repairerSignature?: string;
  depositDate: string;
  expectedReturnDate?: string;
  pdfUrl?: string;
  createdAt: string;
}

// === UI HELPERS ===
export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface TabItem {
  id: string;
  label: string;
  icon?: string;
  badge?: number;
}

export interface MenuItem {
  id: string;
  label: string;
  icon?: string;
  route?: string;
  action?: () => void;
  badge?: number;
  disabled?: boolean;
}

// === PROBLEM CATEGORIES ===
export interface ProblemCategory {
  id: string;
  deviceCategory: DeviceCategory;
  name: string;
  icon?: string;
  avgPriceMin: number;
  avgPriceMax: number;
  currency: string;
}

// === NOTIFICATION EXTENDED ===
export type NotificationTypeExtended =
  | NotificationType
  | 'quote_received'
  | 'quote_accepted'
  | 'quote_rejected'
  | 'payment_received'
  | 'payment_released'
  | 'dispute_opened'
  | 'dispute_resolved'
  | 'chat_message'
  | 'conseil_matched';

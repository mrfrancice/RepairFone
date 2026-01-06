import { Injectable, signal, computed } from '@angular/core';
import {
  RepairerProfile,
  RepairerStats,
  RepairerRequest,
  RequestFilterStatus,
  WorkingHours,
} from '../services/repairer.service';

export interface ProfileFormState {
  step: 'type' | 'info' | 'specialties' | 'area' | 'hours' | 'photos' | 'kyc';
  type: 'shop' | 'independent' | null;
  businessName: string;
  description: string;
  specialties: string[];
  serviceArea: {
    latitude: number;
    longitude: number;
    radius: number;
  };
  address: string;
  workingHours: WorkingHours;
  photos: string[];
}

@Injectable({ providedIn: 'root' })
export class RepairerStore {
  // Profile
  private readonly _profile = signal<RepairerProfile | null>(null);
  private readonly _stats = signal<RepairerStats | null>(null);

  // Requests
  private readonly _requests = signal<RepairerRequest[]>([]);
  private readonly _totalRequests = signal(0);
  private readonly _requestFilter = signal<RequestFilterStatus>('all');
  private readonly _selectedRequest = signal<RepairerRequest | null>(null);

  // Profile form state
  private readonly _profileForm = signal<ProfileFormState>({
    step: 'type',
    type: null,
    businessName: '',
    description: '',
    specialties: [],
    serviceArea: { latitude: 0, longitude: 0, radius: 10 },
    address: '',
    workingHours: {},
    photos: [],
  });

  // Public selectors
  readonly profile = this._profile.asReadonly();
  readonly stats = this._stats.asReadonly();
  readonly requests = this._requests.asReadonly();
  readonly totalRequests = this._totalRequests.asReadonly();
  readonly requestFilter = this._requestFilter.asReadonly();
  readonly selectedRequest = this._selectedRequest.asReadonly();
  readonly profileForm = this._profileForm.asReadonly();

  // Computed
  readonly isVerified = computed(() =>
    this._profile()?.verificationStatus === 'verified'
  );

  readonly hasProfile = computed(() => this._profile() !== null);

  readonly newRequestsCount = computed(() =>
    this._requests().filter(r => r.status === 'pending').length
  );

  readonly inProgressCount = computed(() =>
    this._requests().filter(r => r.status === 'in_progress' || r.status === 'accepted').length
  );

  readonly filteredRequests = computed(() => {
    const filter = this._requestFilter();
    const requests = this._requests();

    switch (filter) {
      case 'new':
        return requests.filter(r => r.status === 'pending');
      case 'accepted':
        return requests.filter(r => r.status === 'accepted' || r.status === 'quote_sent');
      case 'in_progress':
        return requests.filter(r => r.status === 'in_progress');
      case 'completed':
        return requests.filter(r => r.status === 'completed');
      default:
        return requests;
    }
  });

  readonly pendingRequests = computed(() =>
    this._requests().filter(r => r.status === 'pending')
  );

  readonly monthlyRevenue = computed(() =>
    this._stats()?.monthlyRevenue || 0
  );

  readonly qualityScore = computed(() =>
    this._stats()?.qualityScore || 0
  );

  readonly canProceedProfileSetup = computed(() => {
    const form = this._profileForm();
    switch (form.step) {
      case 'type':
        return form.type !== null;
      case 'info':
        return form.businessName.trim().length >= 2;
      case 'specialties':
        return form.specialties.length >= 1;
      case 'area':
        return form.serviceArea.latitude !== 0 && form.serviceArea.longitude !== 0;
      case 'hours':
        return true; // Optional
      case 'photos':
        return true; // Optional
      case 'kyc':
        return true;
      default:
        return false;
    }
  });

  // Actions - Profile
  setProfile(profile: RepairerProfile | null): void {
    this._profile.set(profile);
  }

  updateProfile(updates: Partial<RepairerProfile>): void {
    this._profile.update(profile =>
      profile ? { ...profile, ...updates } : null
    );
  }

  // Actions - Stats
  setStats(stats: RepairerStats): void {
    this._stats.set(stats);
  }

  // Actions - Requests
  setRequests(requests: RepairerRequest[], total: number): void {
    this._requests.set(requests);
    this._totalRequests.set(total);
  }

  appendRequests(requests: RepairerRequest[]): void {
    this._requests.update(current => [...current, ...requests]);
  }

  updateRequest(id: string, updates: Partial<RepairerRequest>): void {
    this._requests.update(requests =>
      requests.map(r => r.id === id ? { ...r, ...updates } : r)
    );

    if (this._selectedRequest()?.id === id) {
      this._selectedRequest.update(r => r ? { ...r, ...updates } : null);
    }
  }

  removeRequest(id: string): void {
    this._requests.update(requests =>
      requests.filter(r => r.id !== id)
    );
  }

  setRequestFilter(filter: RequestFilterStatus): void {
    this._requestFilter.set(filter);
  }

  setSelectedRequest(request: RepairerRequest | null): void {
    this._selectedRequest.set(request);
  }

  // Actions - Profile Form
  initProfileForm(existingProfile?: RepairerProfile): void {
    if (existingProfile) {
      this._profileForm.set({
        step: 'type',
        type: existingProfile.type,
        businessName: existingProfile.businessName || '',
        description: existingProfile.description || '',
        specialties: existingProfile.specialties || [],
        serviceArea: existingProfile.serviceArea || { latitude: 0, longitude: 0, radius: 10 },
        address: existingProfile.address || '',
        workingHours: existingProfile.workingHours || {},
        photos: existingProfile.photos || [],
      });
    } else {
      this._profileForm.set({
        step: 'type',
        type: null,
        businessName: '',
        description: '',
        specialties: [],
        serviceArea: { latitude: 0, longitude: 0, radius: 10 },
        address: '',
        workingHours: {},
        photos: [],
      });
    }
  }

  setProfileFormStep(step: ProfileFormState['step']): void {
    this._profileForm.update(form => ({ ...form, step }));
  }

  setProfileFormType(type: 'shop' | 'independent'): void {
    this._profileForm.update(form => ({ ...form, type }));
  }

  setProfileFormBusinessName(name: string): void {
    this._profileForm.update(form => ({ ...form, businessName: name }));
  }

  setProfileFormDescription(description: string): void {
    this._profileForm.update(form => ({ ...form, description }));
  }

  toggleProfileFormSpecialty(specialtyId: string): void {
    this._profileForm.update(form => {
      const specialties = form.specialties.includes(specialtyId)
        ? form.specialties.filter(s => s !== specialtyId)
        : [...form.specialties, specialtyId];
      return { ...form, specialties };
    });
  }

  setProfileFormServiceArea(area: { latitude: number; longitude: number; radius: number }): void {
    this._profileForm.update(form => ({ ...form, serviceArea: area }));
  }

  setProfileFormAddress(address: string): void {
    this._profileForm.update(form => ({ ...form, address }));
  }

  setProfileFormWorkingHours(hours: WorkingHours): void {
    this._profileForm.update(form => ({ ...form, workingHours: hours }));
  }

  addProfileFormPhoto(photoUrl: string): void {
    this._profileForm.update(form => ({
      ...form,
      photos: [...form.photos, photoUrl],
    }));
  }

  removeProfileFormPhoto(index: number): void {
    this._profileForm.update(form => ({
      ...form,
      photos: form.photos.filter((_, i) => i !== index),
    }));
  }

  nextProfileStep(): void {
    const steps: ProfileFormState['step'][] = [
      'type', 'info', 'specialties', 'area', 'hours', 'photos', 'kyc'
    ];
    const currentIndex = steps.indexOf(this._profileForm().step);
    if (currentIndex < steps.length - 1) {
      this.setProfileFormStep(steps[currentIndex + 1]);
    }
  }

  previousProfileStep(): void {
    const steps: ProfileFormState['step'][] = [
      'type', 'info', 'specialties', 'area', 'hours', 'photos', 'kyc'
    ];
    const currentIndex = steps.indexOf(this._profileForm().step);
    if (currentIndex > 0) {
      this.setProfileFormStep(steps[currentIndex - 1]);
    }
  }

  // Reset
  reset(): void {
    this._profile.set(null);
    this._stats.set(null);
    this._requests.set([]);
    this._totalRequests.set(0);
    this._requestFilter.set('all');
    this._selectedRequest.set(null);
    this.initProfileForm();
  }
}

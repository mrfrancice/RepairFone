-- ============================================================================
-- FastRepair Database Schema - Complete Migration
-- Database: fastRepair_bd
-- ============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

CREATE TYPE user_role AS ENUM ('client', 'repairer', 'admin');
CREATE TYPE user_status AS ENUM ('pending', 'active', 'suspended', 'deactivated');
CREATE TYPE device_category AS ENUM ('smartphone', 'tablet', 'computer', 'laptop', 'smartwatch', 'other');
CREATE TYPE verification_status AS ENUM ('pending', 'under_review', 'verified', 'rejected', 'suspended');
CREATE TYPE request_status AS ENUM ('pending', 'accepted', 'in_progress', 'awaiting_parts', 'completed', 'cancelled', 'disputed');
CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded');
CREATE TYPE payment_method AS ENUM ('cash', 'orange_money', 'mtn_momo', 'wave', 'bank_transfer');
CREATE TYPE notification_type AS ENUM ('request_new', 'request_accepted', 'request_completed', 'payment_received', 'review_received', 'system');
CREATE TYPE delivery_mode AS ENUM ('in_shop', 'at_home', 'postal');

-- ============================================================================
-- USERS TABLE
-- ============================================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'client',
    status user_status NOT NULL DEFAULT 'pending',
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    avatar_url VARCHAR(500),
    is_phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    last_login_at TIMESTAMPTZ,
    preferred_language VARCHAR(5) DEFAULT 'fr',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_users_phone ON users(phone) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_role ON users(role) WHERE deleted_at IS NULL AND status = 'active';

-- ============================================================================
-- REPAIRER PROFILES TABLE
-- ============================================================================

CREATE TABLE repairer_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    business_name VARCHAR(255) NOT NULL,
    description TEXT,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL DEFAULT 'Abidjan',
    commune VARCHAR(100),
    location GEOGRAPHY(POINT, 4326),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    verification_status verification_status NOT NULL DEFAULT 'pending',
    verified_at TIMESTAMPTZ,
    certifications JSONB DEFAULT '[]'::jsonb,
    working_hours JSONB DEFAULT '{}'::jsonb,
    rating_avg DECIMAL(3, 2) DEFAULT 0.00,
    rating_count INTEGER DEFAULT 0,
    total_repairs INTEGER DEFAULT 0,
    completion_rate DECIMAL(5, 2) DEFAULT 0.00,
    accepts_home_service BOOLEAN DEFAULT FALSE,
    home_service_radius_km DECIMAL(5, 2) DEFAULT 10,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT repairer_profiles_user_unique UNIQUE (user_id),
    CONSTRAINT repairer_profiles_rating_range CHECK (rating_avg >= 0 AND rating_avg <= 5)
);

CREATE INDEX idx_repairer_profiles_location ON repairer_profiles USING GIST (location);
CREATE INDEX idx_repairer_profiles_verified ON repairer_profiles (verification_status, rating_avg DESC) WHERE verification_status = 'verified';
CREATE INDEX idx_repairer_profiles_city ON repairer_profiles (city, commune) WHERE verification_status = 'verified';

-- ============================================================================
-- DEVICES TABLE
-- ============================================================================

CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(255) NOT NULL,
    category device_category NOT NULL,
    image_url VARCHAR(500),
    release_year SMALLINT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT devices_brand_model_unique UNIQUE (brand, model)
);

CREATE INDEX idx_devices_category ON devices(category) WHERE is_active = TRUE;
CREATE INDEX idx_devices_brand ON devices(brand) WHERE is_active = TRUE;

-- ============================================================================
-- SERVICE TYPES TABLE
-- ============================================================================

CREATE TABLE service_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(100),
    category VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- REPAIRER SERVICES TABLE
-- ============================================================================

CREATE TABLE repairer_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    repairer_id UUID NOT NULL REFERENCES repairer_profiles(id) ON DELETE CASCADE,
    device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
    service_type_id UUID REFERENCES service_types(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price_min DECIMAL(10, 2) NOT NULL,
    price_max DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'XOF',
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    times_ordered INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT services_price_range_valid CHECK (price_min <= price_max),
    CONSTRAINT services_price_positive CHECK (price_min >= 0)
);

CREATE INDEX idx_services_repairer_id ON repairer_services(repairer_id) WHERE is_available = TRUE;
CREATE INDEX idx_services_device_id ON repairer_services(device_id) WHERE is_available = TRUE;

-- ============================================================================
-- REPAIR REQUESTS TABLE
-- ============================================================================

CREATE TABLE repair_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_number VARCHAR(20) NOT NULL UNIQUE,
    client_id UUID NOT NULL REFERENCES users(id),
    repairer_id UUID REFERENCES repairer_profiles(id),
    device_id UUID REFERENCES devices(id),
    service_id UUID REFERENCES repairer_services(id),
    status request_status NOT NULL DEFAULT 'pending',
    delivery_mode delivery_mode NOT NULL DEFAULT 'in_shop',
    description TEXT NOT NULL,
    device_brand VARCHAR(100),
    device_model VARCHAR(255),
    device_serial_number VARCHAR(100),
    images JSONB DEFAULT '[]'::jsonb,
    estimated_price DECIMAL(10, 2),
    final_price DECIMAL(10, 2),
    currency VARCHAR(3) NOT NULL DEFAULT 'XOF',
    preferred_date DATE,
    scheduled_at TIMESTAMPTZ,
    service_address TEXT,
    service_location GEOGRAPHY(POINT, 4326),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancelled_by UUID REFERENCES users(id),
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_repair_requests_client ON repair_requests(client_id, created_at DESC);
CREATE INDEX idx_repair_requests_repairer ON repair_requests(repairer_id, created_at DESC);
CREATE INDEX idx_repair_requests_status ON repair_requests(status, created_at DESC);
CREATE INDEX idx_repair_requests_number ON repair_requests(request_number);

-- ============================================================================
-- REQUEST STATUS HISTORY TABLE
-- ============================================================================

CREATE TABLE request_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL REFERENCES repair_requests(id) ON DELETE CASCADE,
    previous_status request_status,
    new_status request_status NOT NULL,
    changed_by UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_request_status_history_request ON request_status_history(request_id, created_at DESC);

-- ============================================================================
-- REVIEWS TABLE
-- ============================================================================

CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL REFERENCES repair_requests(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES users(id),
    repairer_id UUID NOT NULL REFERENCES repairer_profiles(id),
    rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    quality_rating SMALLINT CHECK (quality_rating >= 1 AND quality_rating <= 5),
    communication_rating SMALLINT CHECK (communication_rating >= 1 AND communication_rating <= 5),
    timeliness_rating SMALLINT CHECK (timeliness_rating >= 1 AND timeliness_rating <= 5),
    comment TEXT,
    response TEXT,
    response_at TIMESTAMPTZ,
    is_visible BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT reviews_request_unique UNIQUE (request_id)
);

CREATE INDEX idx_reviews_repairer ON reviews(repairer_id, created_at DESC) WHERE is_visible = TRUE;
CREATE INDEX idx_reviews_client ON reviews(client_id, created_at DESC);

-- ============================================================================
-- PAYMENTS TABLE
-- ============================================================================

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL REFERENCES repair_requests(id),
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'XOF',
    payment_method payment_method NOT NULL,
    status payment_status NOT NULL DEFAULT 'pending',
    transaction_ref VARCHAR(100),
    external_transaction_id VARCHAR(255),
    provider_response JSONB DEFAULT '{}'::jsonb,
    payer_phone VARCHAR(20),
    initiated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_request ON payments(request_id, created_at DESC);
CREATE INDEX idx_payments_status ON payments(status, created_at DESC);

-- ============================================================================
-- NOTIFICATIONS TABLE
-- ============================================================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    related_entity_type VARCHAR(50),
    related_entity_id UUID,
    action_url VARCHAR(500),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);

-- ============================================================================
-- GUARANTEES TABLE
-- ============================================================================

CREATE TABLE guarantees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL REFERENCES repair_requests(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    terms TEXT NOT NULL,
    coverage_details JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT guarantees_request_unique UNIQUE (request_id),
    CONSTRAINT guarantees_date_range_valid CHECK (end_date > start_date)
);

-- ============================================================================
-- OTP CODES TABLE
-- ============================================================================

CREATE TABLE otp_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    phone VARCHAR(20) NOT NULL,
    code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    attempts INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_otp_codes_phone ON otp_codes(phone, expires_at DESC);

-- ============================================================================
-- REFRESH TOKENS TABLE
-- ============================================================================

CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    device_info JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id, is_revoked);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_repairer_profiles_updated_at BEFORE UPDATE ON repairer_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_devices_updated_at BEFORE UPDATE ON devices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_repairer_services_updated_at BEFORE UPDATE ON repairer_services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_repair_requests_updated_at BEFORE UPDATE ON repair_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Generate request number
CREATE OR REPLACE FUNCTION generate_request_number()
RETURNS TRIGGER AS $$
DECLARE
    year_part TEXT;
    sequence_num INTEGER;
BEGIN
    year_part := TO_CHAR(NOW(), 'YYYY');
    SELECT COALESCE(MAX(CAST(SPLIT_PART(request_number, '-', 3) AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM repair_requests
    WHERE request_number LIKE 'FR-' || year_part || '-%';
    NEW.request_number := 'FR-' || year_part || '-' || LPAD(sequence_num::TEXT, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_repair_requests_number BEFORE INSERT ON repair_requests FOR EACH ROW EXECUTE FUNCTION generate_request_number();

-- Update repairer rating on review
CREATE OR REPLACE FUNCTION update_repairer_rating_on_review()
RETURNS TRIGGER AS $$
DECLARE
    v_avg_rating DECIMAL(3,2);
    v_rating_count INTEGER;
BEGIN
    SELECT COALESCE(ROUND(AVG(rating)::DECIMAL, 2), 0.00), COUNT(*)
    INTO v_avg_rating, v_rating_count
    FROM reviews
    WHERE repairer_id = COALESCE(NEW.repairer_id, OLD.repairer_id) AND is_visible = TRUE;

    UPDATE repairer_profiles
    SET rating_avg = v_avg_rating, rating_count = v_rating_count, updated_at = NOW()
    WHERE id = COALESCE(NEW.repairer_id, OLD.repairer_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_reviews_update_rating AFTER INSERT OR UPDATE OR DELETE ON reviews FOR EACH ROW EXECUTE FUNCTION update_repairer_rating_on_review();

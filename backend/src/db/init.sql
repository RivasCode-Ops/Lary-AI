-- LARY AI — Database Schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Works table
CREATE TABLE IF NOT EXISTS works (
  id_works UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_works VARCHAR(255) NOT NULL,
  type_works VARCHAR(100),
  start_date DATE,
  end_date DATE,
  address TEXT,
  budget_total DECIMAL(15,2),
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id_user UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_user VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  user_profile VARCHAR(50) NOT NULL DEFAULT 'viewer',
  password_hash VARCHAR(255),
  id_work_allocated UUID REFERENCES works(id_works),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RDO table
CREATE TABLE IF NOT EXISTS rdo (
  id_rdo UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_work UUID NOT NULL REFERENCES works(id_works),
  rdo_number INTEGER NOT NULL,
  rdo_date DATE NOT NULL DEFAULT CURRENT_DATE,
  shift VARCHAR(50),
  weather VARCHAR(100),
  service VARCHAR(255),
  team TEXT,
  content TEXT NOT NULL,
  engineer_notes TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  confidence_avg DECIMAL(5,2),
  created_by UUID REFERENCES users(id_user),
  approved_by UUID REFERENCES users(id_user),
  approved_at TIMESTAMPTZ,
  hash_sha256 VARCHAR(64),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(id_work, rdo_number)
);

-- Photos table
CREATE TABLE IF NOT EXISTS photos (
  id_photo UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_rdo UUID NOT NULL REFERENCES rdo(id_rdo),
  url VARCHAR(500) NOT NULL,
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  tags TEXT[],
  captured_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit trail table
CREATE TABLE IF NOT EXISTS audit_trail (
  id_audit UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_rdo UUID REFERENCES rdo(id_rdo),
  id_user UUID REFERENCES users(id_user),
  action VARCHAR(100) NOT NULL,
  field_name VARCHAR(100),
  old_value TEXT,
  new_value TEXT,
  metadata JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI confidence log
CREATE TABLE IF NOT EXISTS ai_confidence (
  id_ai_log UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_rdo UUID REFERENCES rdo(id_rdo),
  field_name VARCHAR(100) NOT NULL,
  extracted_value TEXT,
  confidence DECIMAL(5,2) NOT NULL,
  was_corrected BOOLEAN DEFAULT false,
  corrected_value TEXT,
  model VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sync queue for offline-first
CREATE TABLE IF NOT EXISTS sync_queue (
  id_sync UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_device VARCHAR(255) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  action VARCHAR(50) NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_rdo_work_date ON rdo(id_work, rdo_date);
CREATE INDEX idx_rdo_status ON rdo(status);
CREATE INDEX idx_audit_rdo ON audit_trail(id_rdo);
CREATE INDEX idx_photos_rdo ON photos(id_rdo);
CREATE INDEX idx_sync_status ON sync_queue(status);

-- Insert default admin user (password: admin123)
INSERT INTO users (name_user, email, user_profile, password_hash)
VALUES ('Admin LARY', 'admin@lary.ai', 'admin',
  crypt('admin123', gen_salt('bf')))
ON CONFLICT (email) DO NOTHING;

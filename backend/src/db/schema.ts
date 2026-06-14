export interface Work {
  id_works: string;
  name_works: string;
  type_works?: string;
  start_date?: string;
  end_date?: string;
  address?: string;
  budget_total?: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface RDO {
  id_rdo: string;
  id_work: string;
  rdo_number: number;
  rdo_date: string;
  shift?: string;
  weather?: string;
  service?: string;
  team?: string;
  content: string;
  engineer_notes?: string;
  status: 'pending' | 'processing' | 'approved' | 'rejected';
  confidence_avg?: number;
  created_by?: string;
  approved_by?: string;
  approved_at?: string;
  hash_sha256?: string;
  created_at: string;
  updated_at: string;
}

export interface ExtractedField {
  field_name: string;
  value: string;
  confidence: number;
  requires_review: boolean;
}

export interface AuditEntry {
  id_audit: string;
  id_rdo: string;
  id_user?: string;
  action: string;
  field_name?: string;
  old_value?: string;
  new_value?: string;
  metadata?: any;
  ip_address?: string;
  created_at: string;
}

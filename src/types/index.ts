export interface User {
  id: string
  email: string
  created_at: string
}

export interface Product {
  id: string
  name: string
  manufacturer?: string
  description?: string
  image_url?: string
  mrp?: number
  net_quantity?: string
  country_of_origin?: string
  date_of_manufacture?: string
  consumer_care_details?: string
  platform?: string
  platform_product_id?: string
  compliance_status: 'compliant' | 'non-compliant' | 'pending'
  created_at: string
  updated_at: string
}

export interface Report {
  id: string
  product_id: string
  reporter_id: string
  license_number?: string
  violation_details: string
  violation_type?: string
  severity: 'low' | 'medium' | 'high'
  status: 'open' | 'in-progress' | 'resolved' | 'closed'
  created_at: string
  updated_at: string
  product?: Product
}

export interface Rule {
  id: string
  rule_name: string
  field_to_validate: string
  rule_type: 'presence' | 'regex' | 'list' | 'range' | 'custom'
  rule_value: Record<string, any>
  description?: string
  is_active: boolean
  created_by?: string
  created_at: string
  updated_at: string
}

export interface ComplianceViolation {
  field: string
  rule_name: string
  message: string
  severity: 'low' | 'medium' | 'high'
}
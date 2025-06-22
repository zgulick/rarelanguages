/**
 * Asset-related interfaces demonstrating comprehensive domain modeling
 * Enterprise-level property and asset management data structures
 */

import { AuditableEntity, EntityStatus, CacheableEntity } from './common.interface';

export interface Asset extends AuditableEntity, CacheableEntity {
  assetNumber: string;
  propertyAddress: PropertyAddress;
  clientName: string;
  investor: string;
  propertyType: PropertyType;
  status: AssetStatus;
  officialApprovalNumber?: string;
  aspenReferenceNumber?: string;
  member?: string;
  scope?: string[];
  assignedAuditBody?: string;
  memo?: string;
  herdNumber?: string;
  landline?: string;
  imageUrl?: string;
  metadata?: AssetMetadata;
  complianceInfo?: ComplianceInfo;
  financialInfo?: FinancialInfo;
}

export interface PropertyAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  coordinates?: GeoCoordinates;
  timezone?: string;
}

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export enum PropertyType {
  RESIDENTIAL = 'residential',
  COMMERCIAL = 'commercial',
  INDUSTRIAL = 'industrial',
  AGRICULTURAL = 'agricultural',
  MIXED_USE = 'mixed_use',
  RECREATIONAL = 'recreational'
}

export enum AssetStatus {
  CERTIFIED = 'certified',
  PENDING_CERTIFICATION = 'pending_certification',
  UNDER_REVIEW = 'under_review',
  NON_COMPLIANT = 'non_compliant',
  EXPIRED = 'expired',
  SUSPENDED = 'suspended'
}

export interface AssetMetadata {
  tags: string[];
  customFields: Record<string, any>;
  integrationData?: IntegrationData;
  riskProfile?: RiskProfile;
}

export interface IntegrationData {
  externalSystemId?: string;
  syncStatus: 'synced' | 'pending' | 'error';
  lastSyncAt?: Date;
  syncErrors?: string[];
}

export interface RiskProfile {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: string[];
  assessmentDate: Date;
  nextAssessmentDue: Date;
}

export interface ComplianceInfo {
  certifications: Certification[];
  regulations: ComplianceRegulation[];
  auditHistory: AuditRecord[];
  nextAuditDue?: Date;
}

export interface Certification {
  type: string;
  issuer: string;
  issuedDate: Date;
  expiryDate?: Date;
  status: 'valid' | 'expired' | 'pending' | 'revoked';
  documentUrl?: string;
}

export interface ComplianceRegulation {
  name: string;
  description: string;
  jurisdiction: string;
  effectiveDate: Date;
  status: 'compliant' | 'non_compliant' | 'pending';
}

export interface AuditRecord {
  id: string;
  auditType: string;
  auditor: string;
  auditDate: Date;
  findings: AuditFinding[];
  overallScore?: number;
  status: 'passed' | 'failed' | 'conditional';
}

export interface AuditFinding {
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recommendation?: string;
  resolved: boolean;
  resolvedDate?: Date;
}

export interface FinancialInfo {
  valuations: PropertyValuation[];
  insuranceInfo?: InsuranceInfo;
  taxInfo?: TaxInfo;
}

export interface PropertyValuation {
  value: number;
  currency: string;
  valuationDate: Date;
  valuationType: 'market' | 'assessed' | 'insurance' | 'investment';
  valuator?: string;
}

export interface InsuranceInfo {
  provider: string;
  policyNumber: string;
  coverageAmount: number;
  premium: number;
  effectiveDate: Date;
  expiryDate: Date;
}

export interface TaxInfo {
  assessedValue: number;
  annualTax: number;
  taxYear: number;
  exemptions?: string[];
}

// Search and filter specific interfaces
export interface AssetSearchCriteria {
  assetNumber?: string;
  propertyAddress?: Partial<PropertyAddress>;
  clientName?: string;
  status?: AssetStatus[];
  propertyType?: PropertyType[];
  dateRange?: {
    field: 'createdAt' | 'updatedAt' | 'nextAuditDue';
    from: Date;
    to: Date;
  };
}

export interface AssetSummary {
  totalAssets: number;
  assetsByStatus: Record<AssetStatus, number>;
  assetsByType: Record<PropertyType, number>;
  recentlyUpdated: Asset[];
  upcomingAudits: Asset[];
}
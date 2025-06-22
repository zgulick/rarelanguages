export interface Asset {
  id: string;
  assetNumber: string;
  propertyAddress: string;
  clientName: string;
  investor: string;
  propertyType: string;
  status: AssetStatus;
  createdDate: Date;
  updatedDate: Date;
  imageUrl?: string;
}

export interface AssetSummary {
  id: string;
  assetNumber: string;
  propertyAddress: string;
  clientName: string;
  status: AssetStatus;
}

export enum AssetStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  ARCHIVED = 'archived'
}

export interface AssetSearchCriteria {
  assetNumber?: string;
  clientName?: string;
  propertyAddress?: string;
  status?: AssetStatus;
  page?: number;
  pageSize?: number;
}

export interface AssetSearchResult {
  assets: AssetSummary[];
  totalCount: number;
  hasMore: boolean;
}
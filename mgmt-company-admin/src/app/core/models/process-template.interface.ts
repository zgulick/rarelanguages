export interface ProcessTemplate {
  id: string;
  name: string;
  version: string;
  statusDate: Date;
  managementCompany: string;
  description: string;
  category: string;
  isActive: boolean;
  processType: string;
}

export interface ProcessTemplateSearchParams {
  page: number;
  size: number;
  search?: string;
  sort?: string;
  category?: string;
  processType?: string;
}

export interface ProcessTemplateSearchResult {
  templates: ProcessTemplate[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface ProcessTemplateCategory {
  name: string;
  count: number;
}
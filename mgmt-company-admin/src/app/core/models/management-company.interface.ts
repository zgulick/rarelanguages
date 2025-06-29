export interface ManagementCompany {
  id?: string;
  name: string;
  type: 'preservation' | 'mortgage' | 'rental' | 'government';
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  primaryContact: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    title: string;
  };
  branding: {
    primaryColor: string;
    secondaryColor: string;
    tertiaryColor: string;
    logoUrl?: string;
    useDefaultColors: boolean;
  };
  languageFileId?: string;
  subscriptionIds: string[];
  processTemplateIds: string[];
  createdDate?: Date;
  lastModified?: Date;
  status: 'active' | 'inactive' | 'pending';
}

export interface ManagementCompanyCreate extends Omit<ManagementCompany, 'id' | 'createdDate' | 'lastModified'> {
  // Specific interface for creation
}

export interface ManagementCompanyUpdate extends Partial<ManagementCompany> {
  id: string;
}

export interface ManagementCompanyListItem {
  id: string;
  name: string;
  type: 'preservation' | 'mortgage' | 'rental' | 'government';
  primaryContactName: string;
  primaryContactEmail: string;
  status: 'active' | 'inactive' | 'pending';
  createdDate: Date;
  lastModified: Date;
}
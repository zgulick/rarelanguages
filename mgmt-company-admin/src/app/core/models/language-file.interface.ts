export interface LanguageFile {
  id: string;
  name: string;
  description: string;
  terms: {
    [backendTerm: string]: string; // backend term -> frontend display term
  };
  lastModified: Date;
  version: string;
}

export interface LanguageTerm {
  backendTerm: string;
  frontendTerm: string;
  category?: string;
  description?: string;
}

export interface LanguageTermUpdate {
  backendTerm: string;
  newFrontendTerm: string;
}

export interface LanguageFileSearchResult {
  terms: LanguageTerm[];
  total: number;
  filteredCount: number;
}
export interface Subscription {
  id: string;
  name: string;
  description: string;
  category: string;
  isActive: boolean;
  lastUpdated: Date;
}

export interface SubscriptionCategory {
  name: string;
  subscriptions: Subscription[];
}

export interface SubscriptionSearchResult {
  subscriptions: Subscription[];
  categories: string[];
  total: number;
}
// Application statuses
export const APPLICATION_STATUSES = ["pending", "contacted", "approved", "rejected"] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

// Merchant onboarding application
export interface MerchantApplication {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  wineCount: number;
  website?: string;
  message?: string;
  status: ApplicationStatus;
  submittedAt: string;
}

// Input for submitting a new application
export interface MerchantApplicationInput {
  company_name: string;
  contact_name: string;
  email: string;
  phone?: string;
  website?: string;
  wine_count?: number;
  message?: string;
}

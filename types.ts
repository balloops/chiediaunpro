
export enum UserRole {
  CLIENT = 'CLIENT',
  PROFESSIONAL = 'PROFESSIONAL',
  ADMIN = 'ADMIN'
}

export enum ServiceCategory {
  WEBSITE = 'Sito Web',
  ECOMMERCE = 'E-commerce',
  DESIGN = 'UX/UI Design',
  BRANDING = 'Branding & Grafica',
  PHOTOGRAPHY = 'Fotografia',
  VIDEO = 'Video & Motion',
  MARKETING = 'Social Media & Marketing',
  SOFTWARE = 'Sviluppo Software & App',
  AI = 'Intelligenza Artificiale',
  THREE_D = '3D & Animazione',
  CUSTOM = 'Altro'
}

export type PlanType = 'FREE' | 'PRO' | 'AGENCY';

export interface PricingPlan {
  id: PlanType;
  name: string;
  price: number;
  credits: number | 'UNLIMITED';
  features: string[];
  isPopular?: boolean;
}

export interface FaqItem {
  question: string;
  answer: string;
  category: 'general' | 'account' | 'payments' | 'trust';
}

export interface SiteContent {
  branding: {
    platformName: string;
    logoUrl?: string;
  };
  home: {
    hero: {
      title: string;
      subtitle: string;
      badgeText: string;
      ctaPrimary: string;
      ctaSecondary: string;
      reviewScore: string;
      reviewCount: string;
      reviewText: string;
      verifiedBadgeTitle: string; // New field
      verifiedBadgeText: string;  // New field
    };
    stats: {
      users: string;
      projects: string;
      rating: string;
    };
    categories: {
      title: string;
      description: string;
    };
    features: {
      title: string;
      description: string;
      items: { title: string; description: string }[]; // Array of 3 items
    };
    cta: {
      title: string;
      description: string;
      buttonClient: string;
      buttonPro: string;
    };
  };
  howItWorks: {
    header: {
      title: string;
      subtitle: string;
    };
    tabs: {
      clientLabel: string;
      proLabel: string;
    };
    clientSteps: { title: string; description: string }[];
    proSteps: { title: string; description: string }[];
    cta: {
      titleClient: string;
      buttonClient: string;
      titlePro: string;
      buttonPro: string;
    }
  };
  helpCenter: {
    title: string;
    items: FaqItem[];
  };
  footer: {
    aboutText: string;
    legalLinks: string[];
  };
}

// Dynamic Form Types
export type FieldType = 'text' | 'textarea' | 'select' | 'multiselect' | 'checkbox_group' | 'radio_group';

export interface FormField {
  id: string;
  label: string;
  type: FieldType;
  options?: string[]; // For select, multiselect, checkbox_group, radio_group
  required?: boolean;
  placeholder?: string;
  subLabels?: string[]; // Optional subtitles for options
}

export interface FormDefinition {
  categoryId: string;
  fields: FormField[];
  budgetOptions: string[];
  askLocation: boolean;
  descriptionPlaceholder?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  skills?: string[];
  phoneNumber?: string; // Added phone number
  isVerified?: boolean; // New field for admin verification
  // Professional specific fields
  brandName?: string;
  location?: string;
  bio?: string;
  portfolioUrl?: string;
  vatNumber?: string;
  experienceLevel?: 'Junior' | 'Mid' | 'Senior' | 'Agency';
  priceRange?: 'Budget' | 'Standard' | 'Premium';
  offeredServices?: string[]; // Changed from ServiceCategory[] to string[] to support dynamic categories
  // Monetization fields
  credits?: number;
  plan?: PlanType;
  // GDPR/Technical
  consentedAt?: string;
}

export interface Review {
  id: string;
  jobId: string;
  clientId: string;
  clientName: string;
  proId: string;
  rating: number; // 1-5
  comment: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface JobLocation {
  city?: string;
  lat?: number;
  lng?: number;
}

export interface JobRequest {
  id: string;
  clientId: string;
  clientName: string;
  title: string;
  description: string;
  category: string; // Changed from enum to string to support dynamic categories
  details?: Record<string, any>;
  budget?: string;
  timeline?: string;
  tags: string[];
  location?: JobLocation;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'ARCHIVED';
  createdAt: string;
}

export interface Quote {
  id: string;
  jobId: string;
  proId: string;
  proName: string;
  price: number;
  message: string;
  timeline: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
}

export enum NotificationType {
  NEW_OPPORTUNITY = 'NEW_OPPORTUNITY',
  NEW_QUOTE = 'NEW_QUOTE',
  QUOTE_ACCEPTED = 'QUOTE_ACCEPTED',
  QUOTE_REJECTED = 'QUOTE_REJECTED',
  REMINDER = 'REMINDER'
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
  metadata?: {
    jobId?: string;
    quoteId?: string;
    targetTab?: string;
  };
}

export interface EventLog {
  id: string;
  timestamp: string;
  userId?: string;
  action: string;
  metadata?: any;
  ip?: string;
}

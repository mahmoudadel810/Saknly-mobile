// Browse response shapes, taken from Saknly-server controllers and models and checked against
// a seeded local server (scripts/local-api.mjs).

export type PropertyCategory = 'sale' | 'rent' | 'student';

export interface PropertyImage {
  _id?: string;
  publicId: string;
  url: string;
  alt?: string;
  isMain?: boolean;
}

export interface PersonRef {
  _id: string;
  userName: string;
  email?: string;
  phone?: string;
}

export interface Property {
  _id: string;
  title: string;
  description: string;
  type: string;
  category: PropertyCategory;
  price: number;
  area: number;
  bedrooms: number;
  bathrooms: number;
  floor?: number;
  totalFloors?: number;
  location: {
    address: string;
    governorate: string;
    city: string;
    district?: string;
    latitude?: number;
    longitude?: number;
  };
  images: PropertyImage[];
  /** Virtual on the server: the main image's URL. */
  mainImage?: string;
  amenities: string[];
  /** A populated user on list and details responses. */
  owner?: PersonRef | string;
  agent?: PersonRef | string | null;
  /** An agency id; the server doesn't populate it. */
  agency?: string | null;
  /** English on most endpoints; /properties/featured translates it to Arabic. */
  status: string;
  views: number;
  /** Present on every response; the public endpoints only return approved, active listings. */
  isApproved?: boolean;
  isActive?: boolean;
  contactInfo?: { name: string; phone: string; email?: string; whatsapp?: string };
  isNegotiable?: boolean;
  isStudentFriendly?: boolean;
  studentHousingDetails?: {
    isEnabled?: boolean;
    roomType?: 'private' | 'shared' | 'dormitory' | null;
    studentsPerRoom?: number;
    genderPolicy?: 'male' | 'female' | 'mixed' | null;
    nearbyUniversities?: { name: string; distanceInKm?: number }[];
  };
  createdAt: string;
}

export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalDocs: number;
  itemsPerPage: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PropertyPage {
  data: Property[];
  pagination: Pagination;
}

export interface Agency {
  _id: string;
  name: string;
  logo?: { publicId: string; url: string };
  description?: string;
  isFeatured?: boolean;
  /** Ids on most responses; GET /agencies/:id populates the approved, active ones. */
  properties: (Property | string)[];
}

export interface Testimonial {
  _id: string;
  name: string;
  text: string;
  image?: string;
  role?: string;
  type: 'general' | 'property' | 'agency';
  createdAt: string;
}

export interface PropertyComment {
  _id: string;
  text: string;
  user?: { _id: string; userName: string; firstName?: string; lastName?: string } | null;
  createdAt: string;
}

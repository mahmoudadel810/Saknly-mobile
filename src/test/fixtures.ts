import type { Property } from '@/api/browseTypes';

export const listing = (id: string, title: string, extra: Partial<Property> = {}): Property => ({
  _id: id,
  title,
  description: `${title} description`,
  type: 'شقة',
  category: 'rent',
  price: 4500,
  area: 90,
  bedrooms: 2,
  bathrooms: 1,
  location: { address: 'شارع الجمهورية', governorate: 'المنوفية', city: 'شبين الكوم' },
  images: [],
  amenities: ['تكييف'],
  owner: { _id: 'o1', userName: 'karim' },
  status: 'available',
  views: 12,
  contactInfo: { name: 'Karim', phone: '01234567893', whatsapp: '01234567893' },
  createdAt: '2026-11-01T00:00:00.000Z',
  ...extra,
});

export const page = (data: Property[]) => ({
  success: true,
  data,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalDocs: data.length,
    itemsPerPage: 12,
    hasNext: false,
    hasPrev: false,
  },
});

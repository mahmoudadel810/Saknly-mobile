import type { Property } from '@/api/browseTypes';

/** Where a listing stands: waiting for an admin, live, or approved but hidden. */
export const publicationState = (property: Pick<Property, 'isApproved' | 'isActive'>) =>
  !property.isApproved ? 'pending' : property.isActive ? 'published' : 'hidden';

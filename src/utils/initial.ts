/** The first letter of a name, for an avatar when there is no picture; "?" when there is none. */
export const initial = (name?: string | null): string =>
  name?.trim().charAt(0).toUpperCase() || '?';

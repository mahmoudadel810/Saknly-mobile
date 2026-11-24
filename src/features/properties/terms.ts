import type { Property } from '@/api/browseTypes';
import { monthOf } from '@/features/listing/draft';
import i18n from '@/i18n';

import { formatMoney, monthLabel, monthsLabel, yearsLabel } from './format';

export interface TermRow {
  label: string;
  value: string;
}

const t = (key: string, options: Record<string, unknown> = {}) => i18n.t(key, options);
const positive = (n: unknown): n is number => typeof n === 'number' && n > 0;
const yesNo = (allowed: boolean) =>
  t(allowed ? 'property.terms.allowed' : 'property.terms.notAllowed');

/** "YYYY-MM" of today, for comparing with a listing's month. */
const thisMonth = (now: Date) =>
  `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

/**
 * The sale or rental terms of a listing, in reading order. A field the owner never filled in
 * (or an older listing that predates it) is left out rather than shown empty.
 */
export const listingTerms = (p: Property, now = new Date()): TermRow[] => {
  const rows: TermRow[] = [];
  const add = (key: string, value: string | false | undefined | null) => {
    if (value) rows.push({ label: t(`property.terms.${key}`), value });
  };

  if (p.category === 'sale') {
    add('payment', p.paymentMethod && t(`listing.payments.${p.paymentMethod}`));
    // A listing switched to cash before edits could clear fields may still carry an old down
    // payment: only show installment figures while installments are offered.
    if (p.paymentMethod && p.paymentMethod !== 'cash') {
      add('downPayment', positive(p.downPayment) && formatMoney(p.downPayment));
      add(
        'installmentYears',
        positive(p.installmentPeriodInYears) && yearsLabel(p.installmentPeriodInYears),
      );
      add(
        'minInstallment',
        positive(p.minInstallmentAmount) && formatMoney(p.minInstallmentAmount),
      );
    }
    add('ownership', p.ownershipType && t(`listing.ownership.${p.ownershipType}`));
    add('status', p.propertyStatus && t(`listing.statuses.${p.propertyStatus}`));
    const delivery = monthOf(p.deliveryDate);
    add('delivery', delivery && monthLabel(delivery));
    add('deliveryTerms', p.deliveryTerms?.trim());
    return rows;
  }

  add('lease', positive(p.leaseDuration) && monthsLabel(p.leaseDuration));
  add('deposit', positive(p.deposit) && formatMoney(p.deposit));
  // The server fills in today when the owner picks nothing, so a past month means "now".
  const available = monthOf(p.availableFrom);
  add('availableFrom', available > thisMonth(now) && monthLabel(available));
  if (typeof p.utilities?.included === 'boolean') {
    add(
      'utilities',
      t(p.utilities.included ? 'property.terms.included' : 'property.terms.notIncluded'),
    );
  }
  if (typeof p.rules?.pets === 'boolean') add('pets', yesNo(p.rules.pets));
  if (typeof p.rules?.parties === 'boolean') add('parties', yesNo(p.rules.parties));
  add('otherRules', p.rules?.other?.trim());
  return rows;
};

/** The student-housing details, and the nearby universities as "name · 2 km". */
export const studentTerms = (p: Property): { rows: TermRow[]; universities: string[] } => {
  const s = p.studentHousingDetails;
  if (p.category !== 'student' || !s) return { rows: [], universities: [] };
  const rows: TermRow[] = [];
  const add = (key: string, value: string | false | undefined | null) => {
    if (value) rows.push({ label: t(`property.terms.${key}`), value });
  };
  add('roomType', s.roomType && t(`listing.roomTypes.${s.roomType}`));
  add('studentsPerRoom', positive(s.studentsPerRoom) && String(s.studentsPerRoom));
  add('genderPolicy', s.genderPolicy && t(`listing.genders.${s.genderPolicy}`));
  add('semester', s.semester && t(`listing.semesters.${s.semester}`));
  if (s.academicYearOnly) add('academicYearOnly', t('property.terms.yes'));
  const universities = (s.nearbyUniversities ?? [])
    .filter((u) => u?.name?.trim())
    .map((u) =>
      typeof u.distanceInKm === 'number'
        ? `${u.name!.trim()} · ${t('property.terms.distance', { distance: u.distanceInKm })}`
        : u.name!.trim(),
    );
  return { rows, universities };
};

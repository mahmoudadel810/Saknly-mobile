import type { Property } from '@/api/browseTypes';
import {
  coverFirst,
  formatMoney,
  monthLabel,
  monthsLabel,
  yearsLabel,
} from '@/features/properties/format';
import { monthlyPayment } from '@/features/properties/installments';
import { listingTerms, studentTerms } from '@/features/properties/terms';
import i18n from '@/i18n';
import { listing } from '@/test/fixtures';

import {
  draftFromProperty,
  EMPTY_DRAFT,
  type ListingDraft,
  listingSchema,
  monthOf,
  toDecimal,
  toListingFields,
} from './draft';
import { removedImages, toPhotoUpdateFields } from './formData';

const base: ListingDraft = {
  ...EMPTY_DRAFT,
  type: 'شقة',
  title: 'شقة للبيع',
  description: 'شقة واسعة',
  price: '1100000',
  area: '120',
  bedrooms: '3',
  bathrooms: '2',
  governorate: 'القاهرة',
  city: 'مدينة نصر',
  contactName: 'منى عادل',
  contactPhone: '01012345678',
};
const sale: ListingDraft = { ...base, category: 'sale' };
const rent: ListingDraft = { ...base, category: 'rent', price: '6000', leaseDuration: '12' };
const student: ListingDraft = {
  ...rent,
  category: 'student',
  roomType: 'shared',
  studentsPerRoom: '2',
  genderPolicy: 'female',
};

const keys = (draft: ListingDraft) => toListingFields(draft).map(([key]) => key);
const errorsOf = (draft: ListingDraft) => {
  try {
    listingSchema.validateSync(draft, { abortEarly: false });
    return [];
  } catch (e) {
    return (e as { inner: { path: string }[] }).inner.map((i) => i.path);
  }
};

afterAll(() => i18n.changeLanguage('ar'));

describe('sale terms in the request', () => {
  it('sends installments, ownership, condition and the delivery month', () => {
    const fields = toListingFields({
      ...sale,
      ownershipType: 'resale',
      propertyStatus: 'underConstruction',
      paymentMethod: 'installment',
      downPayment: '500000',
      installmentYears: '5',
      minInstallment: '9000',
      deliveryMonth: '2028-03',
      deliveryTerms: ' نصف تشطيب ',
    });
    expect(fields).toEqual(
      expect.arrayContaining([
        ['ownershipType', 'resale'],
        ['propertyStatus', 'underConstruction'],
        ['paymentMethod', 'installment'],
        ['downPayment', '500000'],
        ['installmentPeriodInYears', '5'],
        ['minInstallmentAmount', '9000'],
        ['deliveryDate', '2028-03-01'],
        ['deliveryTerms', 'نصف تشطيب'],
      ]),
    );
    expect(keys(sale)).not.toContain('leaseDuration');
    expect(keys(sale)).not.toContain('utilities[included]');
  });

  it('drops installment figures a cash sale still holds from an earlier choice', () => {
    const sent = keys({
      ...sale,
      paymentMethod: 'cash',
      downPayment: '500000',
      installmentYears: '5',
    });
    expect(sent).toContain('paymentMethod');
    expect(sent).not.toContain('downPayment');
    expect(sent).not.toContain('installmentPeriodInYears');
    expect(sent).not.toContain('deliveryDate');
  });

  it('requires a down payment below the price and 1 to 30 years for installments', () => {
    const plan: ListingDraft = { ...sale, paymentMethod: 'cashOrInstallment' };
    expect(errorsOf(plan)).toEqual(expect.arrayContaining(['downPayment', 'installmentYears']));
    expect(errorsOf({ ...plan, downPayment: '1100000', installmentYears: '31' })).toEqual(
      expect.arrayContaining(['downPayment', 'installmentYears']),
    );
    expect(errorsOf({ ...plan, downPayment: '500000', installmentYears: '30' })).toEqual([]);
    // a cash sale doesn't ask for them
    expect(errorsOf(sale)).toEqual([]);
  });

  it('limits the delivery terms and the other rules to 300 characters', () => {
    expect(errorsOf({ ...sale, deliveryTerms: 'x'.repeat(301) })).toEqual(['deliveryTerms']);
    expect(errorsOf({ ...rent, rulesOther: 'x'.repeat(301) })).toEqual(['rulesOther']);
  });
});

describe('rental and student terms in the request', () => {
  it('sends the move-in month, the bills and the house rules', () => {
    const fields = toListingFields({
      ...rent,
      availableMonth: '2027-01',
      petsAllowed: true,
      rulesOther: 'للعائلات فقط',
    });
    expect(fields).toEqual(
      expect.arrayContaining([
        ['availableFrom', '2027-01-01'],
        ['utilities[included]', 'false'],
        ['rules[pets]', 'true'],
        ['rules[parties]', 'false'],
        ['rules[other]', 'للعائلات فقط'],
      ]),
    );
    expect(keys(rent)).not.toContain('paymentMethod');
    expect(keys(rent)).not.toContain('studentHousingDetails[semester]');
  });

  it('sends the stay, the academic year flag and named universities with consecutive indexes', () => {
    const fields = toListingFields({
      ...student,
      semester: 'academic-year',
      academicYearOnly: true,
      universities: [
        { name: 'جامعة المنوفية', distanceInKm: '1.5' },
        { name: '  ', distanceInKm: '3' },
        { name: 'المعهد العالي', distanceInKm: '' },
      ],
    });
    expect(fields).toEqual(
      expect.arrayContaining([
        ['studentHousingDetails[semester]', 'academic-year'],
        ['studentHousingDetails[academicYearOnly]', 'true'],
        ['studentHousingDetails[nearbyUniversities][0][name]', 'جامعة المنوفية'],
        ['studentHousingDetails[nearbyUniversities][0][distanceInKm]', '1.5'],
        ['studentHousingDetails[nearbyUniversities][1][name]', 'المعهد العالي'],
      ]),
    );
    const sent = fields.map(([key]) => key);
    expect(sent).not.toContain('studentHousingDetails[nearbyUniversities][1][distanceInKm]');
    expect(sent).not.toContain('studentHousingDetails[nearbyUniversities][2][name]');
  });

  it('rejects a distance that is not a number of kilometres up to 100', () => {
    const at = (distanceInKm: string) =>
      errorsOf({ ...student, universities: [{ name: 'جامعة', distanceInKm }] });
    expect(at('1.5')).toEqual([]);
    expect(at('')).toEqual([]);
    expect(at('1.')).toEqual(['universities[0].distanceInKm']);
    expect(at('150')).toEqual(['universities[0].distanceInKm']);
  });
});

describe('editing keeps the new fields', () => {
  it('reads them back from the server, months from the ISO string', () => {
    const p = listing('p1', 'x', {
      category: 'student',
      paymentMethod: undefined,
      availableFrom: '2027-02-01T00:00:00.000Z',
      utilities: { included: true },
      rules: { pets: false, parties: true, other: 'ممنوع التدخين' },
      studentHousingDetails: {
        roomType: 'private',
        semester: 'fall',
        academicYearOnly: true,
        nearbyUniversities: [{ name: 'جامعة القاهرة', distanceInKm: 2 }, { distanceInKm: 1 }],
      },
    });
    const draft = draftFromProperty(p);
    expect(draft).toMatchObject({
      paymentMethod: 'cash',
      ownershipType: 'firstOwner',
      availableMonth: '2027-02',
      utilitiesIncluded: true,
      petsAllowed: false,
      partiesAllowed: true,
      rulesOther: 'ممنوع التدخين',
      semester: 'fall',
      academicYearOnly: true,
      universities: [{ name: 'جامعة القاهرة', distanceInKm: '2' }],
    });
    expect(monthOf('2028-12-01T00:00:00.000Z')).toBe('2028-12');
    expect(monthOf(null)).toBe('');
  });

  it('flags no kept photo as main when a new photo is the cover', () => {
    const kept = [
      { publicId: 'a', url: 'https://x/a.jpg', isMain: true },
      { publicId: 'b', url: 'https://x/b.jpg' },
    ];
    expect(toPhotoUpdateFields(kept, [], true)).toEqual([
      ['images[0][publicId]', 'a'],
      ['images[0][isMain]', 'false'],
      ['images[1][publicId]', 'b'],
      ['images[1][isMain]', 'false'],
    ]);
    expect(toPhotoUpdateFields(kept, [])[1]).toEqual(['images[0][isMain]', 'true']);
  });

  it('puts the cover first, wherever the server placed it', () => {
    type Image = { publicId: string; isMain?: boolean };
    const images: Image[] = [
      { publicId: 'new' },
      { publicId: 'old', isMain: true },
      { publicId: 'x' },
    ];
    expect(coverFirst(images).map((i) => i.publicId)).toEqual(['old', 'new', 'x']);
    const single: Image[] = [{ publicId: 'a' }];
    expect(coverFirst(single)).toEqual(single);
  });
});

describe('fields in a hidden section', () => {
  it("don't block the form once their section is gone", () => {
    const leftover = { name: 'جامعة', distanceInKm: '150' };
    expect(errorsOf({ ...student, universities: [leftover] })).toEqual([
      'universities[0].distanceInKm',
    ]);
    // switched to rent: the universities aren't sent, so they aren't checked
    expect(errorsOf({ ...rent, universities: [leftover] })).toEqual([]);
    expect(errorsOf({ ...sale, paymentMethod: 'cash', minInstallment: '900000000' })).toEqual([]);
    expect(errorsOf({ ...rent, deliveryTerms: 'x'.repeat(301), deliveryMonth: '2028' })).toEqual(
      [],
    );
  });

  it('asks for a month when only the year was picked', () => {
    expect(errorsOf({ ...sale, deliveryMonth: '2028' })).toEqual(['deliveryMonth']);
    expect(errorsOf({ ...rent, availableMonth: '2027' })).toEqual(['availableMonth']);
    expect(errorsOf({ ...sale, deliveryMonth: '2028-03' })).toEqual([]);
    expect(keys({ ...sale, deliveryMonth: '2028' })).not.toContain('deliveryDate');
  });
});

describe('photos taken out on an edit', () => {
  it('are matched by id, so a refetched listing keeps its kept photos', () => {
    const existing = [
      { publicId: 'a', url: 'https://x/a.jpg' },
      { publicId: 'b', url: 'https://x/b.jpg' },
    ];
    // the same photos, as new objects from a refetch
    const refetched = existing.map((image) => ({ ...image }));
    expect(removedImages(refetched, [existing[1]])).toEqual([refetched[0]]);
    expect(removedImages(refetched, existing)).toEqual([]);
  });
});

describe('numbers typed in Arabic', () => {
  it('keeps one decimal point, Arabic or Latin', () => {
    expect(toDecimal('١٫٥')).toBe('1.5');
    expect(toDecimal('2,25 كم')).toBe('2.25');
    expect(toDecimal('3')).toBe('3');
  });
});

describe('the terms shown on a listing', () => {
  const onSale = (extra: Partial<Property>) =>
    listing('s1', 'x', { category: 'sale', price: 1_100_000, ...extra });

  it('lists the installment plan in Arabic', async () => {
    await i18n.changeLanguage('ar');
    const rows = listingTerms(
      onSale({
        paymentMethod: 'installment',
        downPayment: 500_000,
        installmentPeriodInYears: 5,
        ownershipType: 'firstOwner',
        propertyStatus: 'underConstruction',
        deliveryDate: '2028-03-01T00:00:00.000Z',
      }),
    );
    expect(rows).toEqual([
      { label: 'طريقة الدفع', value: 'تقسيط' },
      { label: 'المقدم', value: '500,000 ج.م' },
      { label: 'مدة التقسيط', value: '5 سنوات' },
      { label: 'نوع الملكية', value: 'مالك أول' },
      { label: 'حالة العقار', value: 'تحت الإنشاء' },
      { label: 'موعد التسليم', value: 'مارس 2028' },
    ]);
  });

  it('hides a down payment left over on a cash sale', async () => {
    await i18n.changeLanguage('en');
    const rows = listingTerms(onSale({ paymentMethod: 'cash', downPayment: 500_000 }));
    expect(rows).toEqual([{ label: 'Payment', value: 'Cash' }]);
  });

  it('shows a future move-in month only, and the house rules', async () => {
    await i18n.changeLanguage('en');
    const now = new Date(2026, 10, 24);
    const rental = (availableFrom: string) =>
      listingTerms(
        listing('r1', 'x', {
          leaseDuration: 12,
          deposit: 6000,
          availableFrom,
          utilities: { included: false },
          rules: { pets: true, parties: false, other: 'Families only' },
        }),
        now,
      );
    expect(rental('2027-01-01T00:00:00.000Z')).toEqual([
      { label: 'Lease', value: '12 months' },
      { label: 'Deposit', value: 'EGP 6,000' },
      { label: 'Available from', value: 'January 2027' },
      { label: 'Bills', value: 'Not included' },
      { label: 'Pets', value: 'Allowed' },
      { label: 'Gatherings', value: 'Not allowed' },
      { label: 'Other rules', value: 'Families only' },
    ]);
    // the server stores "today" when nothing was picked: not worth a row
    expect(rental('2026-11-02T10:00:00.000Z').map((r) => r.label)).not.toContain('Available from');
  });

  it('lists student housing details and the universities nearby', async () => {
    await i18n.changeLanguage('ar');
    const { rows, universities } = studentTerms(
      listing('st1', 'x', {
        category: 'student',
        studentHousingDetails: {
          roomType: 'shared',
          studentsPerRoom: 2,
          genderPolicy: 'female',
          semester: 'academic-year',
          academicYearOnly: true,
          nearbyUniversities: [{ name: 'جامعة المنوفية', distanceInKm: 1.5 }, { name: 'معهد' }],
        },
      }),
    );
    expect(rows.map((r) => r.value)).toEqual([
      'غرفة مشتركة',
      '2',
      'طالبات',
      'العام الدراسي',
      'نعم',
    ]);
    expect(universities).toEqual(['جامعة المنوفية · 1.5 كم', 'معهد']);
    expect(studentTerms(listing('r1', 'x')).rows).toEqual([]);
  });
});

describe('counted units and money', () => {
  it('uses the Arabic noun forms and plain English plurals', async () => {
    await i18n.changeLanguage('ar');
    expect([1, 2, 3, 10, 11, 24].map(monthsLabel)).toEqual([
      'شهر واحد',
      'شهران',
      '3 أشهر',
      '10 أشهر',
      '11 شهرًا',
      '24 شهرًا',
    ]);
    expect([1, 2, 5, 15].map(yearsLabel)).toEqual(['سنة واحدة', 'سنتان', '5 سنوات', '15 سنة']);
    // the Arabic plural rules go by the last two digits
    expect([100, 103, 111].map(monthsLabel)).toEqual(['100 شهر', '103 أشهر', '111 شهرًا']);
    expect(formatMoney(1_250_000)).toBe('1,250,000 ج.م');
    expect(monthLabel('2027-09')).toBe('سبتمبر 2027');
    await i18n.changeLanguage('en');
    expect([1, 6].map(monthsLabel)).toEqual(['1 month', '6 months']);
    expect(yearsLabel(1)).toBe('1 year');
  });
});

describe('monthlyPayment', () => {
  it('splits the rest evenly at 0% and amortises with interest', () => {
    expect(monthlyPayment(600_000, 0, 5)).toBe(10_000);
    expect(monthlyPayment(1_000_000, 10, 10)).toBeCloseTo(13_215.07, 2);
    expect(monthlyPayment(600_000, 0, 0)).toBeNull();
  });
});

import { countActiveFilters, EMPTY_FILTERS, PAGE_SIZE, parsePrice, toQueryParams } from './filters';

describe('toQueryParams (same keys as the web listing page)', () => {
  it('sends page, size and the default sort with no filters', () => {
    expect(toQueryParams(EMPTY_FILTERS, 1)).toEqual({
      page: '1',
      limit: String(PAGE_SIZE),
      sort: '-createdAt',
    });
  });

  it('maps sale and rent to category, and student housing to isStudentFriendly', () => {
    expect(toQueryParams({ ...EMPTY_FILTERS, kind: 'rent' }, 1).category).toBe('rent');
    const student = toQueryParams({ ...EMPTY_FILTERS, kind: 'student' }, 1);
    expect(student.isStudentFriendly).toBe('true');
    expect(student.category).toBeUndefined();
  });

  it('sends every filter under the server key', () => {
    expect(
      toQueryParams(
        {
          kind: 'sale',
          search: '  شقة ',
          governorate: 'المنوفية',
          city: 'شبين الكوم',
          type: 'شقة',
          bedrooms: 3,
          minPrice: 1000,
          maxPrice: 9000,
          sort: '-price',
        },
        2,
      ),
    ).toEqual({
      page: '2',
      limit: String(PAGE_SIZE),
      sort: '-price',
      category: 'sale',
      search: 'شقة',
      'location.governorate': 'المنوفية',
      'location.city': 'شبين الكوم',
      type: 'شقة',
      bedrooms: '3',
      'price[gte]': '1000',
      'price[lte]': '9000',
    });
  });

  it('caps the search at the 100 characters the server reads', () => {
    expect(toQueryParams({ ...EMPTY_FILTERS, search: 'x'.repeat(150) }, 1).search).toHaveLength(
      100,
    );
  });
});

describe('countActiveFilters', () => {
  it('counts the sheet filters only, not kind, search or sort', () => {
    expect(countActiveFilters({ ...EMPTY_FILTERS, kind: 'rent', search: 'a', sort: 'price' })).toBe(
      0,
    );
    expect(countActiveFilters({ ...EMPTY_FILTERS, city: 'طنطا', minPrice: 0 })).toBe(2);
  });
});

describe('parsePrice', () => {
  it.each([
    ['', null],
    ['12,500', 12500],
    ['abc', null],
    ['0', 0],
  ])('%p -> %p', (text, expected) => expect(parsePrice(text)).toBe(expected));
});

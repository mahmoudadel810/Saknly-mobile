import { isAppPath, setReturnTo, takeReturnTo } from './returnTo';

describe('returnTo', () => {
  it.each([
    ['/properties/123', true],
    ['/', true],
    ['//evil.example/x', false],
    ['https://evil.example', false],
    ['properties/1', false],
    [undefined, false],
  ])('isAppPath(%p) is %p', (path, expected) => expect(isAppPath(path)).toBe(expected));

  it('hands back the recorded path once', () => {
    setReturnTo('/properties/1');
    expect(takeReturnTo()).toBe('/properties/1');
    expect(takeReturnTo()).toBeNull();
  });

  it('ignores a path outside the app', () => {
    setReturnTo('https://evil.example');
    expect(takeReturnTo()).toBeNull();
  });
});

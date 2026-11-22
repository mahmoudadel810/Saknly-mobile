import { preparePhoto } from './photos';

// The native image tools, replaced by a recorder: each save reports a size by its compression.
const mockCalls: { resize?: object; compress: number }[] = [];
let mockSizeFor: (compress: number) => number = () => 200_000;

jest.mock('expo-image-manipulator', () => ({
  SaveFormat: { JPEG: 'jpeg' },
  ImageManipulator: {
    manipulate: () => {
      let resize: object | undefined;
      const context = {
        resize: (size: object) => {
          resize = size;
          return context;
        },
        renderAsync: async () => ({
          saveAsync: async ({ compress, format }: { compress: number; format: string }) => {
            mockCalls.push({ resize, compress });
            return { uri: `file:///cache/${compress}.${format}`, width: 1280, height: 960 };
          },
        }),
      };
      return context;
    },
  },
}));
jest.mock('expo-file-system', () => ({
  File: class {
    size: number;
    constructor(uri: string) {
      this.size = mockSizeFor(Number(/\/([\d.]+)\.jpeg$/.exec(uri)?.[1]));
    }
  },
}));

beforeEach(() => {
  mockCalls.length = 0;
});

describe('preparePhoto', () => {
  it('resizes a phone photo and saves it as JPEG once when it is small enough', async () => {
    const photo = await preparePhoto({ uri: 'file:///IMG_1.HEIC', width: 4032, height: 3024 });
    expect(mockCalls).toEqual([{ resize: { width: 1280, height: null }, compress: 0.7 }]);
    expect(photo).toMatchObject({ uri: 'file:///cache/0.7.jpeg', bytes: 200_000 });
  });

  it('recompresses harder when the first pass is still big', async () => {
    mockSizeFor = (compress) => (compress === 0.7 ? 900_000 : 350_000);
    const photo = await preparePhoto({ uri: 'file:///IMG_2.jpg', width: 3000, height: 4000 });
    expect(mockCalls.map((c) => c.compress)).toEqual([0.7, 0.5]);
    expect(mockCalls[0].resize).toEqual({ width: null, height: 1280 });
    expect(photo.bytes).toBe(350_000);
  });

  it('does not upscale a small photo', async () => {
    mockSizeFor = () => 90_000;
    await preparePhoto({ uri: 'file:///small.jpg', width: 800, height: 600 });
    expect(mockCalls[0].resize).toBeUndefined();
  });
});

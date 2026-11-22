import { registerSchema, resetPasswordSchema } from './schemas';

const valid = {
  userName: 'mona',
  email: 'mona@example.com',
  phone: '01012345678',
  address: 'Cairo',
  password: 'Secret1!',
  confirmPassword: 'Secret1!',
};

const errorsFor = async (values: object) => {
  try {
    await registerSchema.validate(values, { abortEarly: false });
    return [];
  } catch (e) {
    return (e as { path?: string; inner: { path: string }[] }).inner.map((i) => i.path);
  }
};

describe('registerSchema (mirrors the server Joi rules)', () => {
  it('accepts a valid form', async () => {
    expect(await errorsFor(valid)).toEqual([]);
  });

  it.each([
    ['no uppercase', 'secret1!'],
    ['no number', 'Secrets!'],
    ['no symbol', 'Secret12'],
    ['too short', 'S1!a'],
  ])('rejects a password with %s', async (_, password) => {
    expect(await errorsFor({ ...valid, password, confirmPassword: password })).toContain(
      'password',
    );
  });

  it.each(['0101234567', '02012345678', '+201012345678'])('rejects phone %s', async (phone) => {
    expect(await errorsFor({ ...valid, phone })).toContain('phone');
  });

  it('rejects a confirmation that does not match', async () => {
    expect(await errorsFor({ ...valid, confirmPassword: 'Other1!x' })).toContain('confirmPassword');
  });

  it('rejects a username shorter than 3 characters', async () => {
    expect(await errorsFor({ ...valid, userName: 'mo' })).toContain('userName');
  });
});

describe('resetPasswordSchema', () => {
  it('requires the emailed code and matching new passwords', async () => {
    await expect(
      resetPasswordSchema.validate({
        email: 'mona@example.com',
        code: 'a1B2c3',
        newPassword: 'Secret1!',
        confirmNewPassword: 'Secret1!',
      }),
    ).resolves.toBeTruthy();
    await expect(
      resetPasswordSchema.validate({
        email: 'mona@example.com',
        code: '',
        newPassword: 'Secret1!',
        confirmNewPassword: 'Secret1!',
      }),
    ).rejects.toBeTruthy();
  });
});

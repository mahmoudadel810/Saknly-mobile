import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import LoginScreen from '@/app/(auth)/login';
import i18n from '@/i18n';

const mockSignIn = jest.fn();

jest.mock('@/auth/AuthProvider', () => ({ useAuth: () => ({ signIn: mockSignIn }) }));
jest.mock('expo-router', () => {
  const { Text } = jest.requireActual('react-native');
  return {
    router: { push: jest.fn(), replace: jest.fn() },
    Link: ({ children }: { children: React.ReactNode }) => children,
  };
});
jest.mock('react-native-safe-area-context', () => {
  const { View } = jest.requireActual('react-native');
  return { SafeAreaView: View };
});

beforeAll(() => i18n.changeLanguage('ar'));
beforeEach(() => mockSignIn.mockReset());

describe('LoginScreen', () => {
  it('shows field errors and does not call the server for an empty form', async () => {
    await render(<LoginScreen />);
    await fireEvent.press(screen.getByRole('button', { name: 'دخول' }));
    expect(await screen.findAllByText('هذا الحقل مطلوب')).toHaveLength(2);
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('signs in with the trimmed email', async () => {
    mockSignIn.mockResolvedValue(undefined);
    await render(<LoginScreen />);
    await fireEvent.changeText(screen.getByLabelText('البريد الإلكتروني'), '  mona@example.com ');
    await fireEvent.changeText(screen.getByLabelText('كلمة المرور'), 'Secret1!');
    await fireEvent.press(screen.getByRole('button', { name: 'دخول' }));
    await waitFor(() => expect(mockSignIn).toHaveBeenCalledWith('mona@example.com', 'Secret1!'));
  });

  it("shows the server's message when sign-in fails", async () => {
    mockSignIn.mockRejectedValue({
      isAxiosError: true,
      response: { status: 400, data: { message: 'Email or password are not correct' } },
    });
    await render(<LoginScreen />);
    await fireEvent.changeText(screen.getByLabelText('البريد الإلكتروني'), 'mona@example.com');
    await fireEvent.changeText(screen.getByLabelText('كلمة المرور'), 'Wrong1!x');
    await fireEvent.press(screen.getByRole('button', { name: 'دخول' }));
    expect(await screen.findByText('Email or password are not correct')).toBeTruthy();
  });
});

type GoogleAuthEnvironment = {
  EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?: string;
};

type GoogleAuthConfig = {
  webClientId: string;
};

export function readGoogleAuthConfig(
  environment: GoogleAuthEnvironment,
): GoogleAuthConfig | null {
  const webClientId = environment.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim();
  if (!webClientId?.endsWith('.apps.googleusercontent.com')) return null;
  return { webClientId };
}

export function readGoogleIdToken(response: unknown): string | null {
  if (typeof response !== 'object' || response === null) return null;
  const candidate = response as { type?: unknown; data?: unknown };
  if (candidate.type !== 'success' || typeof candidate.data !== 'object' || !candidate.data) {
    return null;
  }

  const token = (candidate.data as { idToken?: unknown }).idToken;
  if (typeof token !== 'string') return null;
  return token.trim() || null;
}

export function readAuthErrorCode(error: unknown): string | null {
  if (typeof error !== 'object' || error === null) return null;
  const code = (error as { code?: unknown }).code;
  return typeof code === 'string' ? code : null;
}

type EmailSignInErrors = {
  email?: string;
  password?: string;
};

type EmailSignInValidation = {
  credentials: { email: string; password: string } | null;
  errors: EmailSignInErrors;
};

export type CreateAccountErrors = {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
};

type CreateAccountValidation = {
  account: { displayName: string; email: string; password: string } | null;
  errors: CreateAccountErrors;
};

export function validateEmailSignIn(emailValue: string, password: string): EmailSignInValidation {
  const email = emailValue.trim().toLocaleLowerCase('en-US');
  const errors: EmailSignInErrors = {};

  if (!/^\S+@\S+\.\S+$/.test(email)) errors.email = 'Enter a valid email address.';
  if (!password) errors.password = 'Enter your password.';

  return {
    credentials: Object.keys(errors).length === 0 ? { email, password } : null,
    errors,
  };
}

export function getEmailSignInErrorMessage(error: unknown): string {
  switch (readAuthErrorCode(error)) {
    case 'auth/invalid-credential':
    case 'auth/invalid-email':
    case 'auth/user-disabled':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'The email or password is incorrect. Check both and try again.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a moment, then try again.';
    case 'auth/network-request-failed':
      return 'Could not reach Bantay. Check your connection and try again.';
    default:
      return 'Email sign-in could not be completed. Try again.';
  }
}

export function validateCreateAccount(
  firstNameValue: string,
  lastNameValue: string,
  emailValue: string,
  password: string,
  confirmPassword: string,
): CreateAccountValidation {
  const firstName = firstNameValue.trim().replace(/\s+/g, ' ');
  const lastName = lastNameValue.trim().replace(/\s+/g, ' ');
  const displayName = `${firstName} ${lastName}`.trim();
  const email = emailValue.trim().toLocaleLowerCase('en-US');
  const errors: CreateAccountErrors = {};

  if (!firstName) errors.firstName = 'Enter your first name.';
  if (!lastName) errors.lastName = 'Enter your last name.';
  if (!/^\S+@\S+\.\S+$/.test(email)) errors.email = 'Enter a valid email address.';
  if (password.length < 8) errors.password = 'Use at least 8 characters.';
  if (confirmPassword !== password) errors.confirmPassword = 'Passwords do not match.';

  return {
    account: Object.keys(errors).length === 0 ? { displayName, email, password } : null,
    errors,
  };
}

export function getCreateAccountErrorMessage(error: unknown): string {
  switch (readAuthErrorCode(error)) {
    case 'auth/email-already-in-use':
      return 'An account already uses this email. Sign in instead.';
    case 'auth/invalid-email':
      return 'Enter a valid email address.';
    case 'auth/weak-password':
      return 'Use a stronger password with at least 8 characters.';
    case 'auth/network-request-failed':
      return 'Could not reach Bantay. Check your connection and try again.';
    case 'auth/operation-not-allowed':
      return 'Email account creation is not available right now.';
    default:
      return 'Your account could not be created. Try again.';
  }
}

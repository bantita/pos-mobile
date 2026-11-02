import type { LocaleShape } from '../../types';
import type { auth as thAuth } from '../th/auth';

export const auth: LocaleShape<typeof thAuth> = {
  login: 'Log in',
  username: 'Username',
  password: 'Password',
};

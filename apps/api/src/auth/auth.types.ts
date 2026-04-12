import type { UserPublic } from './dto/user-public.dto';

export type GoogleOAuthProfile = {
  email: string;
  name: string;
  picture?: string;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: UserPublic;
};

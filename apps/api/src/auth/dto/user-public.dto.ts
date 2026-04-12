import type { User } from '@prisma/client';

export type UserPublic = Pick<
  User,
  'id' | 'email' | 'name' | 'avatarUrl' | 'authProvider' | 'createdAt' | 'updatedAt'
>;

export function toUserPublic(user: User): UserPublic {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    authProvider: user.authProvider,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

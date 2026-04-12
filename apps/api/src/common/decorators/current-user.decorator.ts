import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { User } from '@prisma/client';

export const CurrentUser = createParamDecorator(
  (data: keyof User | undefined, ctx: ExecutionContext): User | User[keyof User] => {
    const request = ctx.switchToHttp().getRequest<{ user: User }>();
    const user = request.user;
    if (!user) {
      return undefined as never;
    }
    return data ? user[data] : user;
  },
);

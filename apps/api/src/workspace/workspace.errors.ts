import { HttpException, HttpStatus } from '@nestjs/common';

export function throwWorkspaceLimitReached(): never {
  throw new HttpException(
    {
      code: 'WORKSPACE_LIMIT_REACHED',
      message:
        'This workspace has reached the maximum of 5 members (including pending invitations).',
    },
    HttpStatus.CONFLICT,
  );
}

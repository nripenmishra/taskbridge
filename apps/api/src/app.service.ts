import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth(): { ok: boolean; service: string } {
    return { ok: true, service: 'taskbridge-api' };
  }
}

import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import { AuthProvider, type User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import type { LoginDto } from './dto/login.dto';
import type { RefreshDto } from './dto/refresh.dto';
import type { RegisterDto } from './dto/register.dto';
import type { AuthResponse, GoogleOAuthProfile } from './auth.types';
import { toUserPublic } from './dto/user-public.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        name: dto.name,
        authProvider: AuthProvider.email,
        passwordHash,
      },
    });
    return this.issueTokens(user);
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (!user || user.authProvider === AuthProvider.google) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.issueTokens(user);
  }

  async refresh(dto: RefreshDto): Promise<AuthResponse> {
    const secret = this.config.getOrThrow<string>('JWT_REFRESH_SECRET');
    let payload: { sub: string; typ?: string };
    try {
      payload = await this.jwt.verifyAsync<{ sub: string; typ?: string }>(
        dto.refreshToken,
        { secret },
      );
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
    if (payload.typ !== 'refresh') {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return this.issueTokens(user);
  }

  async googleOAuthLogin(profile: GoogleOAuthProfile): Promise<AuthResponse> {
    const email = profile.email.toLowerCase();
    let user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          name: profile.name,
          authProvider: AuthProvider.google,
          avatarUrl: profile.picture ?? null,
          passwordHash: null,
        },
      });
    } else if (user.authProvider === AuthProvider.email && user.passwordHash) {
      throw new ConflictException(
        'This email is registered with password. Sign in with email or link accounts.',
      );
    } else if (user.authProvider === AuthProvider.google && profile.picture) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { avatarUrl: profile.picture, name: profile.name || user.name },
      });
    }
    return this.issueTokens(user);
  }

  private issueTokens(user: User): AuthResponse {
    const accessExpires = this.config.get<string>('JWT_ACCESS_EXPIRES', '15m');
    const refreshExpires = this.config.get<string>('JWT_REFRESH_EXPIRES', '7d');
    const refreshSecret = this.config.getOrThrow<string>('JWT_REFRESH_SECRET');

    const accessToken = this.jwt.sign(
      {
        sub: user.id,
        email: user.email,
        typ: 'access',
      },
      { expiresIn: accessExpires as NonNullable<JwtSignOptions['expiresIn']> },
    );

    const refreshToken = this.jwt.sign(
      { sub: user.id, typ: 'refresh' },
      {
        secret: refreshSecret,
        expiresIn: refreshExpires as NonNullable<JwtSignOptions['expiresIn']>,
      },
    );

    return {
      accessToken,
      refreshToken,
      user: toUserPublic(user),
    };
  }
}

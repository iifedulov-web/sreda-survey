import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const roleName = dto.role ?? 'respondent';

    const role = await this.prisma.role.findUnique({ where: { name: roleName } });
    if (!role) throw new UnauthorizedException('Role not found');

    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { role: true },
    });

    if (existing) {
      return {
        id: existing.id,
        email: existing.email,
        role: existing.role.name,
      };
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        roleId: role.id,
      },
      include: { role: true },
    });

    return {
      id: user.id,
      email: user.email,
      role: user.role.name,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { role: true },
    });

    if (!user) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(dto.password, user.password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const payload = { sub: user.id, email: user.email, role: user.role.name };

    return {
      access_token: await this.jwt.signAsync(payload),
    };
  }
}

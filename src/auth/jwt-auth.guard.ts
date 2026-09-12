import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const auth = req.headers.authorization as string | undefined;

    if (!auth || !auth.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const token = auth.slice(7).trim();

    try {
      const payload = this.jwt.verify(token, {
        secret: process.env.JWT_SECRET || 'dev-secret-change-me',
      });

      req.user = {
        id: payload.sub,
        sub: payload.sub,
        email: payload.email,
        role: payload.role,
      };

      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}

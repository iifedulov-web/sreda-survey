import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Auth negative (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const email = 'neg_' + Date.now() + '@test.local';
  const password = 'Passw0rd!123';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = app.get(PrismaService);

    const hash = await bcrypt.hash(password, 10);
    const respondentRole = await prisma.role.upsert({
      where: { name: 'respondent' },
      update: {},
      create: { name: 'respondent' },
    });

    await prisma.user.create({
      data: { email, password: hash, roleId: respondentRole.id },
    });
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('POST /auth/login with wrong password -> 401', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'WrongPassword123!' })
      .expect(401);
  });

  it('GET /auth/me with invalid token -> 401', async () => {
    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', 'Bearer invalid.token.here')
      .expect(401);
  });
});



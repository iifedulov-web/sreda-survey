import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Auth & RBAC (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwt: JwtService;
  let adminToken = '';
  let respondentToken = '';

  const adminEmail = 'admin_' + Date.now() + '@test.local';
  const respondentEmail = 'resp_' + Date.now() + '@test.local';
  const password = 'Passw0rd!123';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = app.get(PrismaService);
    jwt = app.get(JwtService);

    const hash = await bcrypt.hash(password, 10);

    const adminRole = await prisma.role.upsert({
      where: { name: 'admin' },
      update: {},
      create: { name: 'admin' },
    });

    const respondentRole = await prisma.role.upsert({
      where: { name: 'respondent' },
      update: {},
      create: { name: 'respondent' },
    });

    const adminUser = await prisma.user.create({
      data: { email: adminEmail, password: hash, roleId: adminRole.id },
    });

    const respondentUser = await prisma.user.create({
      data: { email: respondentEmail, password: hash, roleId: respondentRole.id },
    });

    adminToken = await jwt.signAsync({
      sub: adminUser.id,
      email: adminUser.email,
      role: adminRole.name,
    });

    respondentToken = await jwt.signAsync({
      sub: respondentUser.id,
      email: respondentUser.email,
      role: respondentRole.name,
    });
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('GET /auth/me without token -> 401', async () => {
    await request(app.getHttpServer()).get('/auth/me').expect(401);
  });

  it('GET /auth/me with token -> 200', async () => {
    const res = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', 'Bearer ' + adminToken)
      .expect(200);

    expect(res.body.email).toBe(adminEmail);
    expect(res.body.role).toBe('admin');
  });

  it('GET /auth/admin-test with admin token -> 200', async () => {
    const res = await request(app.getHttpServer())
      .get('/auth/admin-test')
      .set('Authorization', 'Bearer ' + adminToken)
      .expect(200);
  });

  it('GET /auth/admin-test with respondent token -> 403', async () => {
    await request(app.getHttpServer())
      .get('/auth/admin-test')
      .set('Authorization', 'Bearer ' + respondentToken)
      .expect(403);
  });
});


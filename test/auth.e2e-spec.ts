import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../src/app.module';

describe('Auth & RBAC (e2e)', () => {
  let app: INestApplication;
  let adminToken = '';
  let respondentToken = '';

  const adminEmail = `admin_${Date.now()}@test.local`;
  const respondentEmail = `resp_${Date.now()}@test.local`;
  const password = 'Passw0rd!123';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

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

    await prisma.user.create({
      data: { email: adminEmail, passwordHash: hash, roleId: adminRole.id },
    });

    await prisma.user.create({
      data: { email: respondentEmail, passwordHash: hash, roleId: respondentRole.id },
    });

    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: adminEmail, password })
      .expect(201);

    const respondentLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: respondentEmail, password })
      .expect(201);

    adminToken =
      adminLogin.body.accessToken ??
      adminLogin.body.access_token ??
      adminLogin.body.token ??
      '';

    respondentToken =
      respondentLogin.body.accessToken ??
      respondentLogin.body.access_token ??
      respondentLogin.body.token ??
      '';

    expect(adminToken).toBeTruthy();
    expect(respondentToken).toBeTruthy();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /auth/me without token -> 401', async () => {
    await request(app.getHttpServer()).get('/auth/me').expect(401);
  });

  it('GET /auth/me with token -> 200', async () => {
    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
  });

  it('GET /auth/admin-test with admin token -> 200', async () => {
    await request(app.getHttpServer())
      .get('/auth/admin-test')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.message).toBe('admin access granted');
      });
  });

  it('GET /auth/admin-test with respondent token -> 403', async () => {
    await request(app.getHttpServer())
      .get('/auth/admin-test')
      .set('Authorization', `Bearer ${respondentToken}`)
      .expect(403);
  });
});




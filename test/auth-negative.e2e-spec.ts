import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';



describe('Auth negative (e2e)', () => {
  let app: INestApplication;

  const email = `neg_${Date.now()}@test.local`;
  const password = 'Passw0rd!123';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /auth/login with wrong password -> 401', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password, role: 'respondent' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'WrongPass123!' })
      .expect(401);
  });

  it('GET /auth/me with invalid token -> 401', async () => {
    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', 'Bearer invalid.token.value')
      .expect(401);
  });
});

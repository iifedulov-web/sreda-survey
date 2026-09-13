import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../src/prisma/prisma.service';
import { AppModule } from '../src/app.module';
import request from 'supertest';

describe('Surveys (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await prisma.answer.deleteMany();
    await prisma.response.deleteMany();
    await prisma.option.deleteMany();
    await prisma.question.deleteMany();
    await prisma.survey.deleteMany();
    await app.close();
  });

  it('POST /surveys -> 201 create survey', async () => {
    const payload = {
      title: 'MVP Survey',
      questions: [
        {
          text: 'Ваш любимый цвет?',
          type: 'SINGLE_CHOICE',
          options: [{ text: 'Красный' }, { text: 'Синий' }],
        },
        {
          text: 'Комментарий',
          type: 'TEXT',
        },
      ],
    };

    const res = await request(app.getHttpServer())
      .post('/surveys')
      .set('x-role', 'admin')
      .send(payload)
      .expect(201);

    expect(res.body.id).toBeDefined();
    expect(res.body.questions).toHaveLength(2);
  });

  it('GET /surveys/:id -> 200', async () => {
    const created = await prisma.survey.create({
      data: {
        title: 'Survey for GET',
        questions: {
          create: [
            {
              text: 'Q1',
              type: 'SINGLE_CHOICE',
              options: { create: [{ text: 'A' }, { text: 'B' }] },
            },
          ],
        },
      },
      include: { questions: { include: { options: true } } },
    });

    const res = await request(app.getHttpServer()).get(`/surveys/${created.id}`).expect(200);

    expect(res.body.id).toBe(created.id);
    expect(Array.isArray(res.body.questions)).toBe(true);
  });

  it('POST /surveys/:id/responses -> 201 happy path', async () => {
    const created = await prisma.survey.create({
      data: {
        title: 'Survey for response',
        questions: {
          create: [
            {
              text: 'Q1',
              type: 'SINGLE_CHOICE',
              options: { create: [{ text: 'A' }, { text: 'B' }] },
            },
            {
              text: 'Q2',
              type: 'TEXT',
            },
          ],
        },
      },
      include: { questions: { include: { options: true } } },
    });

    const q1 = created.questions.find((q) => q.type === 'SINGLE_CHOICE')!;
    const q2 = created.questions.find((q) => q.type === 'TEXT')!;
    const option = q1.options[0];

    const payload = {
      userId: 'e2e-user',
      answers: [
        { questionId: q1.id, optionId: option.id },
        { questionId: q2.id, textValue: 'Все отлично' },
      ],
    };

    const res = await request(app.getHttpServer())
      .post(`/surveys/${created.id}/responses`)
      .send(payload)
      .expect(201);

    expect(res.body.id).toBeDefined();
    expect(res.body.answers).toHaveLength(2);
  });

  it('PATCH /surveys/:id/deactivate -> 200 and then responses -> 400', async () => {
    const created = await prisma.survey.create({
      data: {
        title: 'Survey to deactivate',
        questions: {
          create: [
            {
              text: 'Q1',
              type: 'TEXT',
            },
          ],
        },
      },
      include: { questions: true },
    });

    await request(app.getHttpServer())
      .patch(`/surveys/${created.id}/deactivate`)
      .set('x-role', 'admin')
      .expect(200);

    const q1 = created.questions[0];
    const payload = {
      answers: [{ questionId: q1.id, textValue: 'after deactivation' }],
    };

    await request(app.getHttpServer())
      .post(`/surveys/${created.id}/responses`)
      .send(payload)
      .expect(400);
  });

  it('POST /surveys/:id/responses -> 400 invalid optionId', async () => {
    const created = await prisma.survey.create({
      data: {
        title: 'Survey invalid option',
        questions: {
          create: [
            {
              text: 'Q1',
              type: 'SINGLE_CHOICE',
              options: { create: [{ text: 'A' }] },
            },
          ],
        },
      },
      include: { questions: { include: { options: true } } },
    });

    const q1 = created.questions[0];

    const payload = {
      answers: [{ questionId: q1.id, optionId: 'not-existing-option' }],
    };

    await request(app.getHttpServer())
      .post(`/surveys/${created.id}/responses`)
      .send(payload)
      .expect(400);
  });

  it('POST /surveys/:id/responses -> 404 unknown survey', async () => {
    const payload = {
      answers: [{ questionId: 'any-question', textValue: 'text' }],
    };

    await request(app.getHttpServer())
      .post('/surveys/not-existing-survey/responses')
      .send(payload)
      .expect(404);
  });
describe('GET /surveys/:id/stats', () => {
  it('should return stats for single_choice and text questions', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/surveys')
      .set('x-role', 'admin')
      .send({
        title: 'Stats survey',
        questions: [
          {
            text: 'Favorite color?',
            type: 'SINGLE_CHOICE',
            options: [{ text: 'Red' }, { text: 'Blue' }],
          },
          {
            text: 'Why?',
            type: 'TEXT',
          },
        ],
      })
      .expect(201);

    const surveyId = createRes.body.id;

    await request(app.getHttpServer())
      .post(`/surveys/${surveyId}/responses`)
      .send({
        answers: [
          { questionId: createRes.body.questions[0].id, selectedOptionId: createRes.body.questions[0].options[0].id },
          { questionId: createRes.body.questions[1].id, textValue: 'Because it is warm' },
        ],
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/surveys/${surveyId}/responses`)
      .send({
        answers: [
          { questionId: createRes.body.questions[0].id, selectedOptionId: createRes.body.questions[0].options[1].id },
          { questionId: createRes.body.questions[1].id, textValue: 'Because it is calm' },
        ],
      })
      .expect(201);

    const statsRes = await request(app.getHttpServer())
      .get(`/surveys/${surveyId}/stats`)
      .expect(200);

    expect(statsRes.body.surveyId).toBe(surveyId);
    expect(statsRes.body.totalResponses).toBe(2);

    const single = statsRes.body.questions.find((q: any) => q.type === 'SINGLE_CHOICE');
    expect(single.totalAnswers).toBe(2);
    expect(single.options.length).toBe(2);

    const textQ = statsRes.body.questions.find((q: any) => q.type === 'TEXT');
    expect(textQ.totalAnswers).toBe(2);
    expect(textQ.textAnswers.length).toBe(2);
  });

  it('should return 404 for unknown survey', async () => {
    await request(app.getHttpServer())
      .get('/surveys/00000000-0000-0000-0000-000000000000/stats')
      .expect(404);
  });
});
});



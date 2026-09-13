import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { QuestionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSurveyDto } from './dto/create-survey.dto';
import { SubmitResponseDto } from './dto/submit-response.dto';

@Injectable()
export class SurveysService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSurveyDto) {
    for (const q of dto.questions) {
      if (q.type === 'SINGLE_CHOICE') {
        if (!q.options || q.options.length === 0) {
          throw new BadRequestException('SINGLE_CHOICE question must have options');
        }
      }
    }

    return this.prisma.survey.create({
      data: {
        title: dto.title,
        questions: {
          create: dto.questions.map((q, qIndex) => ({
            text: q.text,
            type: q.type as QuestionType,
            order: q.order ?? qIndex,
            options: q.options?.length
              ? {
                  create: q.options.map((o, oIndex) => ({
                    text: o.text,
                    order: o.order ?? oIndex,
                  })),
                }
              : undefined,
          })),
        },
      },
      include: {
        questions: {
          orderBy: { order: 'asc' },
          include: { options: { orderBy: { order: 'asc' } } },
        },
      },
    });
  }

  async getById(id: string) {
    const survey = await this.prisma.survey.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { order: 'asc' },
          include: { options: { orderBy: { order: 'asc' } } },
        },
      },
    });

    if (!survey) throw new NotFoundException('Survey not found');
    return survey;
  }

  async submitResponse(surveyId: string, dto: SubmitResponseDto) {
    const survey = await this.prisma.survey.findUnique({
      where: { id: surveyId },
      include: { questions: { include: { options: true } } },
    });

    if (!survey) throw new NotFoundException('Survey not found');
    if (!survey.isActive) throw new BadRequestException('Survey is not active');

    const questionMap = new Map(survey.questions.map((q) => [q.id, q]));

    for (const a of dto.answers) {
      const q = questionMap.get(a.questionId);
      if (!q) throw new BadRequestException(`Question ${a.questionId} does not belong to survey`);

      if (q.type === 'SINGLE_CHOICE') {
        if (!a.optionId) throw new BadRequestException(`optionId is required for question ${q.id}`);
        const ok = q.options.some((o) => o.id === a.optionId);
        if (!ok) throw new BadRequestException(`Option ${a.optionId} is invalid for question ${q.id}`);
      }

      if (q.type === 'TEXT') {
        if (!a.textValue || !a.textValue.trim()) {
          throw new BadRequestException(`textValue is required for question ${q.id}`);
        }
      }
    }

    return this.prisma.response.create({
      data: {
        surveyId,
        userId: dto.userId,
        answers: {
          create: dto.answers.map((a) => ({
            questionId: a.questionId,
            optionId: a.optionId,
            textValue: a.textValue,
          })),
        },
      },
      include: { answers: true },
    });
  }

  async deactivate(id: string) {
    const exists = await this.prisma.survey.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Survey not found');

    return this.prisma.survey.update({
      where: { id },
      data: { isActive: false },
    });
  }
  async getStats(surveyId: string) {
    const survey = await this.prisma.survey.findUnique({
      where: { id: surveyId },
      include: {
        questions: {
          include: {
            options: true,
            answers: {
              include: {
                response: {
                  select: { createdAt: true },
                },
              },
            },
          },
        },
        responses: {
          select: { id: true },
        },
      },
    });

    if (!survey || !survey.isActive) {
      throw new NotFoundException('Survey not found');
    }

    const totalResponses = survey.responses.length;

    const questions = survey.questions.map((q) => {
      if (q.type === QuestionType.SINGLE_CHOICE) {
        const optionCounts = new Map<string, number>();
        for (const opt of q.options) optionCounts.set(opt.id, 0);

        for (const a of q.answers) {
          if (a.selectedOptionId && optionCounts.has(a.selectedOptionId)) {
            optionCounts.set(a.selectedOptionId, (optionCounts.get(a.selectedOptionId) ?? 0) + 1);
          }
        }

        const totalAnswers = q.answers.length;
        const options = q.options.map((opt) => {
          const count = optionCounts.get(opt.id) ?? 0;
          const percentage = totalAnswers === 0 ? 0 : Number(((count / totalAnswers) * 100).toFixed(2));
          return {
            optionId: opt.id,
            text: opt.text,
            count,
            percentage,
          };
        });

        return {
          questionId: q.id,
          text: q.text,
          type: q.type,
          totalAnswers,
          options,
        };
      }

      const textAnswers = q.answers
        .filter((a) => !!a.textValue)
        .map((a) => ({
          answerId: a.id,
          text: a.textValue!,
          submittedAt: a.response.createdAt,
        }));

      return {
        questionId: q.id,
        text: q.text,
        type: q.type,
        totalAnswers: textAnswers.length,
        textAnswers,
      };
    });

    return {
      surveyId: survey.id,
      title: survey.title,
      totalResponses,
      questions,
    };
  }
}




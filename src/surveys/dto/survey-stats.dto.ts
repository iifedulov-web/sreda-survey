import { ApiProperty } from '@nestjs/swagger';
import { QuestionType } from '@prisma/client';

export class OptionStatDto {
  @ApiProperty()
  optionId: string;

  @ApiProperty()
  text: string;

  @ApiProperty()
  count: number;

  @ApiProperty({ example: 62.5 })
  percentage: number;
}

export class TextAnswerDto {
  @ApiProperty()
  answerId: string;

  @ApiProperty()
  text: string;

  @ApiProperty({ format: 'date-time' })
  submittedAt: Date;
}

export class QuestionStatsDto {
  @ApiProperty()
  questionId: string;

  @ApiProperty()
  text: string;

  @ApiProperty({ enum: QuestionType })
  type: QuestionType;

  @ApiProperty()
  totalAnswers: number;

  @ApiProperty({ type: [OptionStatDto], required: false })
  options?: OptionStatDto[];

  @ApiProperty({ type: [TextAnswerDto], required: false })
  textAnswers?: TextAnswerDto[];
}

export class SurveyStatsDto {
  @ApiProperty()
  surveyId: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  totalResponses: number;

  @ApiProperty({ type: [QuestionStatsDto] })
  questions: QuestionStatsDto[];
}

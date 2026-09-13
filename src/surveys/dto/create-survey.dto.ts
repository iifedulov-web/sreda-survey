import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export enum QuestionTypeDto {
  SINGLE_CHOICE = 'SINGLE_CHOICE',
  TEXT = 'TEXT',
}

export class CreateOptionDto {
  @ApiProperty({ example: 'Красный' })
  @IsString()
  text!: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}

export class CreateQuestionDto {
  @ApiProperty({ example: 'Ваш любимый цвет?' })
  @IsString()
  text!: string;

  @ApiProperty({ enum: QuestionTypeDto, example: QuestionTypeDto.SINGLE_CHOICE })
  @IsEnum(QuestionTypeDto)
  type!: QuestionTypeDto;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @ApiPropertyOptional({ type: [CreateOptionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOptionDto)
  options?: CreateOptionDto[];
}

export class CreateSurveyDto {
  @ApiProperty({ example: 'Опрос по продукту' })
  @IsString()
  title!: string;

  @ApiProperty({ type: [CreateQuestionDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionDto)
  questions!: CreateQuestionDto[];
}

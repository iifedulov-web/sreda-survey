import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';

export class SubmitAnswerDto {
  @ApiProperty()
  @IsString()
  questionId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  optionId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  textValue?: string;
}

export class SubmitResponseDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({ type: [SubmitAnswerDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SubmitAnswerDto)
  answers!: SubmitAnswerDto[];
}

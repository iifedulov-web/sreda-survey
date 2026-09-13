import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateSurveyDto } from './dto/create-survey.dto';
import { SubmitResponseDto } from './dto/submit-response.dto';
import { SurveyStatsDto } from './dto/survey-stats.dto';
import { GetSurveyStatsQueryDto } from './dto/get-survey-stats-query.dto';
import { SurveysService } from './surveys.service';

@ApiTags('surveys')
@Controller('surveys')
export class SurveysController {
  constructor(private readonly surveysService: SurveysService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create survey' })
  @ApiCreatedResponse({ description: 'Survey created' })
  create(@Body() dto: CreateSurveyDto) {
    return this.surveysService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get survey by id' })
  @ApiParam({ name: 'id', description: 'Survey id' })
  @ApiOkResponse({ description: 'Survey found' })
  getById(@Param('id') id: string) {
    return this.surveysService.getById(id);
  }

  @Post(':id/responses')
  @ApiOperation({ summary: 'Submit survey response' })
  @ApiParam({ name: 'id', description: 'Survey id' })
  @ApiBody({ type: SubmitResponseDto })
  @ApiCreatedResponse({ description: 'Response submitted' })
  submitResponse(@Param('id') id: string, @Body() dto: SubmitResponseDto) {
    return this.surveysService.submitResponse(id, dto);
  }

  @Patch(':id/deactivate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate survey' })
  @ApiParam({ name: 'id', description: 'Survey id' })
  @ApiOkResponse({ description: 'Survey deactivated' })
  deactivate(@Param('id') id: string) {
    return this.surveysService.deactivate(id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get survey statistics' })
  @ApiParam({ name: 'id', description: 'Survey id' })
  @ApiOkResponse({ type: SurveyStatsDto })
  @ApiQuery({ name: 'textLimit', required: false, type: Number })
  @ApiQuery({ name: 'textOffset', required: false, type: Number })
  @ApiQuery({ name: 'textSearch', required: false, type: String })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  getSurveyStats(
    @Param('id') id: string,
    @Query() query: GetSurveyStatsQueryDto,
  ): Promise<SurveyStatsDto> {
    return this.surveysService.getSurveyStats(id, query);
  }
}


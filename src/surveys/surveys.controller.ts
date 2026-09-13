import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import {
  ApiBody,
  ApiHeader,
  ApiOperation, ApiOkResponse, ApiNotFoundResponse, ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AdminGuard } from '../common/guards/admin.guard';
import { CreateSurveyDto } from './dto/create-survey.dto';
import { SubmitResponseDto } from './dto/submit-response.dto';
import { SurveyStatsDto } from './dto/survey-stats.dto';
import { SurveysService } from './surveys.service';

@ApiTags('surveys')
@Controller('surveys')
export class SurveysController {
  constructor(private readonly surveysService: SurveysService) {}

  @Post()
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Create survey (admin only)' })
  @ApiHeader({ name: 'x-role', required: true, description: 'Must be admin' })
  @ApiBody({ type: CreateSurveyDto })
  @ApiResponse({ status: 201, description: 'Survey created' })
  create(@Body() dto: CreateSurveyDto) {
    return this.surveysService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get survey by id' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Survey returned' })
  getById(@Param('id') id: string) {
    return this.surveysService.getById(id);
  }

  @Post(':id/responses')
  @ApiOperation({ summary: 'Submit survey response' })
  @ApiParam({ name: 'id' })
  @ApiBody({ type: SubmitResponseDto })
  @ApiResponse({ status: 201, description: 'Response submitted' })
  submit(@Param('id') id: string, @Body() dto: SubmitResponseDto) {
    return this.surveysService.submitResponse(id, dto);
  }

  @Patch(':id/deactivate')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Deactivate survey (admin only)' })
  @ApiHeader({ name: 'x-role', required: true, description: 'Must be admin' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Survey deactivated' })
  deactivate(@Param('id') id: string) {
    return this.surveysService.deactivate(id);
  }
  @ApiOperation({ summary: 'Get survey analytics/statistics' })
  @ApiParam({ name: 'id', description: 'Survey ID' })
  @ApiOkResponse({ type: SurveyStatsDto })
  @ApiNotFoundResponse({ description: 'Survey not found' })
  @Get(':id/stats')
  getSurveyStats(@Param('id') id: string) {
    return this.surveysService.getStats(id);
  }
}



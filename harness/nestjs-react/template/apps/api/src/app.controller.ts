import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('app')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'API root — version and status' })
  @ApiResponse({ status: 200, description: 'API is running' })
  getRoot() {
    return this.appService.getInfo();
  }
}

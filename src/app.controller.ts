import { Controller, Get, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './decorators/public.decorator';
import { Response } from 'express';
import { RawResponse } from './decorators/raw.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @RawResponse()
  @Public()
  getHello(@Res() res: Response) {
    return this.appService.getHello(res);
  }
}

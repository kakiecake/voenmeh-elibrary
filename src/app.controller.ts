import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';

@Controller('/')
export class AppController {
  constructor() {}

  @Get('/')
  getIndex(@Res() res: Response) {
    res.render('index', {
      title: 'initial commit',
      message: 'wish everyone a good day',
    });
  }
}

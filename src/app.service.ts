import { Injectable, Res } from '@nestjs/common';
import { Response } from 'express';
import { join } from 'path';
@Injectable()
export class AppService {
  getHello(@Res() res: Response) {
    return res.sendFile(join(process.cwd(), 'dist', 'raw', 'index.html'));
  }
}

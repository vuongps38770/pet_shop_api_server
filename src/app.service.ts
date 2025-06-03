import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'con nha ai ma vao api nay loi ngay truoc khi anh nong';
  }
}

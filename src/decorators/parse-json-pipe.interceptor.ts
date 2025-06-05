import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ParseJsonPipe<T> implements PipeTransform {
  transform(value: any): T {
    try {
      return JSON.parse(value) as T;
    } catch {
      throw new BadRequestException('Invalid JSON format');
    }
  }
}
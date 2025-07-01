import { IsOptional, IsString, IsBoolean, IsEnum, IsObject,IsNumberString } from 'class-validator';
import { Types } from 'mongoose';

export class CreateNotificationDto {
  userId?: string|Types.ObjectId; 

  @IsOptional()
  @IsBoolean()
  isBroadcast?: boolean;

  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsString()
  type: 'order' | 'promo' | 'system' | string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsObject()
  data?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  isRead?: boolean;
  
  image_url:string;

  scheduled_time:Date


}


import { IsArray, IsMongoId } from 'class-validator';

export class MarkAsReadDto {
  @IsArray()
  @IsMongoId({ each: true })
  notificationIds: string[];
}


export class GetUserNotificationDto {
  @IsOptional()
  @IsNumberString()
  page?: string; 

  @IsOptional()
  @IsNumberString()
  limit?: string; 
}

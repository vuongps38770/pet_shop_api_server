import { BadRequestException, Body, Controller, Get, Post, Query, UploadedFile, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { messaging } from 'firebase-admin';
import { CreateNotificationDto, GetUserNotificationDto } from './dto/notification.req.dto';
import { CurrentUserId } from 'src/decorators/current-user-id.decorator';
import { PartialStandardResponse } from 'src/common/type/standard-api-respond-format';
import { FileInterceptor } from '@nestjs/platform-express';
import { Public } from 'src/decorators/public.decorator';

@Controller('notification')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService

  ) { }

  // @Post('admin-send-to-all')
  // async adminSendNotifiToAllUser(@Body() payload: messaging.MessagingPayload) {
  //   await this.notificationService.adminSendNotifiToAllUser(payload)
  // }

  
  @Post('broadcast')
  @UseInterceptors(FileInterceptor('image'))
  async adminBroadcast(
    @Body('data') rawData: string, @UploadedFile() image: Express.Multer.File
  ): Promise<PartialStandardResponse<any>> {
    let dto: CreateNotificationDto;
    try {
      dto = JSON.parse(rawData);
    } catch (err) {
      throw new BadRequestException('Invalid JSON in data field');
    }
    await this.notificationService.adminBroadcast(dto, image)
    return {}
  }

  @Get()
  async getUserNotifications(
    @CurrentUserId() userId: string,
    @Query() query: GetUserNotificationDto
  ): Promise<PartialStandardResponse<any>> {
    const data = await this.notificationService.getByUser(userId, query)
    return {
      data
    };
  }

  @Post('read')
  async markNotificationsAsRead(
    @CurrentUserId() userId: string,
    @Body('notificationIds') notificationIds: string[]
  ) {
    return this.notificationService.markAsRead(notificationIds, userId);
  }

  @Public()
  @Get('admin')
  async getAllForAdmin(@Query('page') page: number, @Query('limit') limit: number):Promise<PartialStandardResponse<any>> {
    const data = await this.notificationService.findAllForAdmin(page, limit)
    return{data}
  }

}

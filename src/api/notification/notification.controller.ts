import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { messaging } from 'firebase-admin';
import { CreateNotificationDto, GetUserNotificationDto } from './dto/notification.req.dto';
import { CurrentUserId } from 'src/decorators/current-user-id.decorator';
import { PartialStandardResponse } from 'src/common/type/standard-api-respond-format';

@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) { }

  @Post('admin-send-to-all')
  async adminSendNotifiToAllUser(@Body() payload: messaging.MessagingPayload) {
    await this.notificationService.adminSendNotifiToAllUser(payload)
  }


  @Post('broadcast')
  async adminBroadcast(
    @Body() dto: CreateNotificationDto
  ) {
    await this.notificationService.adminBroadcast(dto)
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


}

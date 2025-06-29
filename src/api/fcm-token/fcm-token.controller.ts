import { Body, Controller, Post } from '@nestjs/common';
import { FcmTokenService } from './fcm-token.service';
import { PartialStandardResponse } from 'src/common/type/standard-api-respond-format';
import { CurrentUserId } from 'src/decorators/current-user-id.decorator';

@Controller('fcm-token')
export class FcmTokenController {
  constructor(private readonly fcmTokenService: FcmTokenService) { }

  @Post('update')
  async updateFcmToken(
    @CurrentUserId() userId: string,
    @Body('userAgent') userAgent: string,
    @Body('fcm-token') token: string
  ): Promise<PartialStandardResponse<void>> {
    await this.fcmTokenService.updateFcmToken(userId, userAgent, token)
    return {}
  }
  
}

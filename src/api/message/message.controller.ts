import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { MessageService } from './message.service';
import { CurrentUserId } from 'src/decorators/current-user-id.decorator';
import { PartialStandardResponse } from 'src/common/type/standard-api-respond-format';
import { CreateMessageDto } from './dto/message-req.dto';

@Controller('message')
export class MessageController {
  constructor(private readonly messageService: MessageService) { }


  @Get('conversations')
  async getAllConversations(@CurrentUserId() userId: string): Promise<PartialStandardResponse<any>> {
    const data = await this.messageService.getAllConversations(userId);
    return { data }
  }

  @Post('send-first-message')
  async sendFirstMessage(
    @CurrentUserId() senderId: string,
    createMessageDto: CreateMessageDto,
    targetIds: string[],
  ): Promise<PartialStandardResponse<any>> {
    const data = await this.messageService.sendFirstMessage(createMessageDto, senderId, targetIds);
    return { data };
  }

  @Post('create-shop-conversation')
  async createShopConversation(
    @CurrentUserId() userId: string,
    targetIds: string[],
  ): Promise<PartialStandardResponse<any>> {
    let data;
    if (!targetIds || targetIds.length === 0) {
      data = await this.messageService.createShopConversation([userId]);
    } else {
      data = await this.messageService.createShopConversation([userId, ...targetIds]);
    }
    return { data };
  }

  @Get('older-messages/:conversationId')
  async getOlderMessagesByConversationId(
    @Param('conversationId') conversationId: string,
    @Query('limit') limit: number = 10,
    @Query('before') before?: string
  ): Promise<PartialStandardResponse<any>> {
    let data;
    if (before) {
      const before_date = new Date(before);
      data = await this.messageService.getOlderMessagesByConversationId(conversationId, limit, before_date);
    } else {
      data = await this.messageService.getOlderMessagesByConversationId(conversationId, limit);
    }

    return { data };
  }

  
  @Get('conversations-shop-for-admin')
  async getAllConversationsShopForAdmin(): Promise<PartialStandardResponse<any>> {
    const data = await this.messageService.getAllConversationsShopForAdmin();
    return { data };
  }
  
}

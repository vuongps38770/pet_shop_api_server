import { Module } from '@nestjs/common';
import { MessageService } from './message.service';
import { MessageController } from './message.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Conversation, ConversationSchema } from './entity/conversation.entity';
import { Message, MessageSchema } from './entity/message.entity';
import { MessageGateway } from './stragery/messgae.gateway';
import { AuthModule } from '../auth/auth.module';
import { EventEmitter2, EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  controllers: [MessageController],
  providers: [MessageService, MessageGateway],
  imports: [
    MongooseModule.forFeature([
      {
        name: Conversation.name,
        schema: ConversationSchema
      },
      {
        name: Message.name,
        schema: MessageSchema
      }
    ]),
    AuthModule,
    EventEmitterModule.forRoot(),
    
  ],
  exports: [MessageService, MongooseModule, MessageGateway],
})
export class MessageModule {}

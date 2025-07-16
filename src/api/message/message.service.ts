import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Message, MessageDocument } from './entity/message.entity';
import { ClientSession, Connection, Model, Types } from 'mongoose';
import { Conversation, ConversationDocument } from './entity/conversation.entity';
import { CreateMessageDto } from './dto/message-req.dto';
import { log } from 'console';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CONVERSATION_TRIGGER_EVENT } from './const/event.constants';
import { Roles } from 'src/decorators/roles.decorator';
import { UserRole } from '../auth/models/role.enum';

@Injectable()
export class MessageService implements OnModuleInit {
    constructor(
        @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
        @InjectModel(Conversation.name) private conversationModel: Model<ConversationDocument>,
        @InjectConnection() private readonly connection: Connection,
        private readonly eventEmitter: EventEmitter2
    ) { }
    onModuleInit() {
        log(this.eventEmitter, 'eventEmitter');
    }

    async createMessage(createMessageDto: CreateMessageDto, senderId: string): Promise<Message> {

        log('senderIdmsg:', senderId);
        const conversation = await this.conversationModel.findById(createMessageDto.conversationId).populate('participants');

        const createdMessage = new this.messageModel({
            ...createMessageDto,
            sender: new Types.ObjectId(senderId),
        });

        await createdMessage.save();

        if (conversation) {
            conversation.lastMessageId = createdMessage._id as Types.ObjectId;
            await conversation.save()
            const { lastMessageId, ...rest } = conversation.toObject();
            try {
                this.eventEmitter.emit(CONVERSATION_TRIGGER_EVENT, {
                    conversation: {
                        ...rest,
                        lastMessage: createdMessage
                    }
                });
            } catch (error) {
                log('Error emitting event:', error);
            }

        }

        return createdMessage.save();
    }

    async sendFirstMessage(createMessageDto: CreateMessageDto, senderId: string, targetIds: string[]): Promise<Message> {
        try {
            const session = await this.connection.startSession();
            session.startTransaction();
            const conversation = await this.createShopConversationSession([senderId, ...targetIds], session);

            const createdMessage = new this.messageModel({
                ...createMessageDto,
                sender: new Types.ObjectId(senderId),
                conversationId: conversation._id,
            });
            await createdMessage.save({ session });
            conversation.lastMessageId = createdMessage._id as Types.ObjectId;
            await conversation.save({ session });
            return createdMessage;
        } catch (error) {
            log('Error creating first message:', error);
            throw error;
        }

    }

    async createShopConversation(participants: string[]): Promise<ConversationDocument> {
        const conversation = new this.conversationModel({
            participants: participants.map(id => new Types.ObjectId(id)),
            type: 'shop',
        });
        return conversation.save();
    }
    async createShopConversationSession(participants: string[], session: ClientSession): Promise<ConversationDocument> {
        const conversation = new this.conversationModel({
            participants: participants.map(id => new Types.ObjectId(id)),
            type: 'shop',
        });
        return conversation.save({ session });
    }
    async getAllConversations(userId: string): Promise<Conversation[]> {
        const objectUserId = new Types.ObjectId(userId);
        const conversations = await this.conversationModel
            .find({ participants: objectUserId })
            .populate('lastMessageId')
            .exec();

        return conversations;

    }

    async getOlderMessagesByConversationId(conversationId: string, limit: number = 10, before?: Date): Promise<any[]> {
        return this.messageModel.find({ conversationId: new Types.ObjectId(conversationId), createdAt: { $lt: before || new Date() } })
            .sort({ createdAt: -1 })
            .limit(limit)
            .exec();
    }




    async getAllConversationsShopForAdmin(): Promise<any[]> {
        const conversations = await this.conversationModel.find({ type: 'shop' })
            .populate([
                {
                    path: 'participants',
                    select: 'name avatar role'
                },
                {
                    path: 'lastMessageId'
                }
            ])
            .lean()
        log('Conversations for admin:', conversations);
        const result = conversations.map(conv => {
            const { lastMessageId, ...rest } = conv;
            return {
                ...rest,
                lastMessage: lastMessageId
            };
        });
        return result;


    }



}

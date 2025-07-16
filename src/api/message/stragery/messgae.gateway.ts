import { JwtService } from "@nestjs/jwt";
import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { CreateMessageDto } from "../dto/message-req.dto";
import { MessageService } from "../message.service";
import { Inject } from "@nestjs/common";
import { log } from "console";
import { OnEvent } from "@nestjs/event-emitter";
import { ConversationDocument } from "../entity/conversation.entity";
import { MessageDocument } from "../entity/message.entity";
import { ADMIN_JOIN_PREVIEW_CONVERSATION_EVENT, ADMIN_PREVIEW_CONVERSATION_ROOM, CONVERSATION_TRIGGER_EVENT, JOIN_CONVERSATION_EVENT, RECEIVE_MESSAGE_EVENT, SEND_MESSAGE_EVENT, UNAUTHORIZED_EVENT } from "../const/event.constants";


export interface AuthenticatedSocket extends Socket {
    data: {
        user: {
            sub: string;
            username: string;
            role: 'admin' | 'user';
        };
    };
}

@WebSocketGateway({
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        allowedHeaders: ['Content-Type'],
        credentials: true
    },
    namespace: 'message',
})
export class MessageGateway {
    constructor(
        @Inject('JWT_ACCESS') private readonly jwtAccessService: JwtService,
        private readonly messageService: MessageService,
    ) {

    }

    @WebSocketServer()
    server: Server;
    logCurrentClientCount() {
        this.server.allSockets().then((sockets) => {
            console.log('Số client đang kết nối:', sockets.size);
        }).catch((e) => {
            console.log('Không thể log số client:', e.message);
        });
    }
    async handleConnection(client: AuthenticatedSocket) {
        try {
            const token = client.handshake.auth.token || client.handshake.headers['authorization']?.split(' ')[1]
            const payload = this.jwtAccessService.verify(token);
            client.data.user = payload;
            client.join(payload.sub);
            console.log('User connected:', payload.sub);
        } catch (e) {
            console.error('Unauthorized socket');
            client.emit(UNAUTHORIZED_EVENT, 'Unauthorized');
            client.disconnect();
        }
    }

    handleDisconnect(client: AuthenticatedSocket) {
        console.log('User disconnected:', client.data.user.sub);
    }


    @SubscribeMessage(SEND_MESSAGE_EVENT)
    async handleSendMessage(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody()
        data: CreateMessageDto
    ) {
        const senderId = client.data.user.sub;
        const message = await this.messageService.createMessage(data, senderId);
        this.server.to(data.conversationId).emit(RECEIVE_MESSAGE_EVENT, message);
        const roomId = data.conversationId;
        this.server.in(roomId).allSockets().then((sockets) => {
            console.log(`Đã gửi message cho ${sockets.size} client trong room ${roomId}`);
        });

    }

    @SubscribeMessage(JOIN_CONVERSATION_EVENT)
    async handleJoinConversation(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: { conversationId: string },
    ) {
        client.join(data.conversationId);
    }

    @SubscribeMessage(ADMIN_JOIN_PREVIEW_CONVERSATION_EVENT)
    async handleAdminPreviewConversation(
        @ConnectedSocket() client: AuthenticatedSocket,
    ) {
        log('Admin joining preview conversation room', client.data.user.sub);
        client.join(ADMIN_PREVIEW_CONVERSATION_ROOM);
    }


    @OnEvent(CONVERSATION_TRIGGER_EVENT)
    handleConversationTriggerEvent(payload: { conversation: ConversationDocument; message: MessageDocument }) {
        log('Conversation trigger event received:', payload);
        const { conversation } = payload;
        this.server.to(ADMIN_PREVIEW_CONVERSATION_ROOM).emit(CONVERSATION_TRIGGER_EVENT, conversation);
    }
}
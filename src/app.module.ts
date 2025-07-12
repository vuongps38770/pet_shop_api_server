import { Module, OnModuleInit, Logger, MiddlewareConsumer } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { InjectConnection, MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Connection } from 'mongoose';
import { AuthModule } from './api/auth/auth.module';
import { ProductModule } from './api/products/product.module';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './api/auth/guards/auth-guard';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { CategoryModule } from './api/category/category.module';
import { SupplierModule } from './api/supplier/supplier.module';
import { VariantUnitModule } from './api/variant-units/variant-unit.module';
import { VariantGroupModule } from './api/variant-group/variant-group.module';
import { ProductVariantModule } from './api/product-variant/product-variant.module';
import { CartModule } from './api/cart/cart.module';
import { FavoriteModule } from './api/favorite/favorite.module';
import { AddressModule } from './api/adress/address.module';
import { UsersModule } from './api/users/users.module';
import { OrderDetailModule } from './api/order-detail/order-detail.module';
import { OrderModule } from './api/order/order.module';
import { ScheduleModule } from '@nestjs/schedule';
import { OrderAutoCancelService } from './jobs/order-auto-cancel';
import { PaymentModule } from './api/payment/payment.module';
import { StockHistoryModule } from './api/stock-history/stock-history.module';
import { PaymentAutoCheckService } from './jobs/payment-auto-check';
import { FirebaseAdminModule } from './firebase-admin/firebase-admin.module';
import { RatingModule } from './api/rating/rating.module';
import { redisProvider } from './redis/redis.provider';
import { RedisModule } from './redis/redis.module';
import { FcmTokenModule } from './api/fcm-token/fcm-token.module';
import { NotificationModule } from './api/notification/notification.module';
import { BroadcastCronService } from './jobs/broadcast-queue';
import { LoggerMiddleware } from './middleware/route-logger.middleware';
import { VoucherModule } from './api/voucher/voucher.module';
import { BullModule } from '@nestjs/bull';
import { RedisQueueName } from './redis/constants/redis-queue.constant';
import Redis from 'ioredis';
import { RefundProcessor } from './worker/refund.prossesor';
import { BannerModule } from './api/banner/banner.module';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
      }),
      inject: [ConfigService],
    }),
    //jwt module
    JwtModule.register({
      secret: process.env.ACCESS_SECRET,
      signOptions: { expiresIn: '15m' },

    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        createClient: (type) => {
          const redisUrl = configService.getOrThrow<string>('REDIS_URL');
          const isSecure = redisUrl.startsWith('rediss://');
          return new Redis(redisUrl, {
            tls: isSecure ? {} : undefined,
            maxRetriesPerRequest: null,
            enableReadyCheck: false,
          });
        }
      }),
    }),
    BullModule.registerQueue({ name: RedisQueueName.REFUND_QUEUE }),
    //module cho api
    // AuthModule,
    AuthModule,
    // ProductModule,
    ProductModule,
    //cloudinary module
    CloudinaryModule,
    //CategoryModule,
    CategoryModule,
    //supplierModule
    SupplierModule,
    //groupVariant
    VariantGroupModule,
    //variantUnit
    VariantUnitModule,
    //productVariant
    ProductVariantModule,
    //cartModule
    CartModule,
    //FavoriteModule
    FavoriteModule,
    //AddressModule
    AddressModule,
    //UsersModule
    UsersModule,
    //OrderDetailModule
    OrderDetailModule,
    //OrderModule
    OrderModule,
    //PaymentModule
    PaymentModule,
    //StockHistoryModule
    StockHistoryModule,
    FirebaseAdminModule,
    RatingModule,
    RedisModule,
    FcmTokenModule,
    NotificationModule,
    VoucherModule,
    BannerModule



  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    OrderAutoCancelService,
    PaymentAutoCheckService,
    BroadcastCronService,
    RefundProcessor
  ],

})
export class AppModule implements OnModuleInit {
  private readonly logger = new Logger(AppModule.name);

  constructor(@InjectConnection() private readonly connection: Connection) { }

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }

  async onModuleInit() {
    const state = this.connection.readyState;
    this.logger.log(`MongoDB readyState: ${this.connection.readyState}`);

    this.connection.on('connected', () => {
      this.logger.log('MongoDB connected successfully (event)');
    });
    this.connection.on('error', (err) => {
      this.logger.error('MongoDB connection error:', err);
    });
    if (this.connection.readyState === 1) {
      this.logger.log('MongoDB is already connected (checked manually)');
    }
    if (state === 1) {
      this.logger.log('MongoDB is already connected (manual check)');
    }
  }

}


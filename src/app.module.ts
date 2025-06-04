import { Module, OnModuleInit, Logger } from '@nestjs/common';
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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
      signOptions: {expiresIn: '15m' }, 

    }),
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



  ],
  controllers: [AppController],
  providers: [AppService,
    {
      provide:APP_GUARD,
      useClass: AuthGuard, 
    }
  ],
})
export class AppModule implements OnModuleInit {
  private readonly logger = new Logger(AppModule.name);

  constructor(@InjectConnection() private readonly connection: Connection) { }

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


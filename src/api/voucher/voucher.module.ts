import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VoucherService } from './voucher.service';
import { VoucherController } from './voucher.controller';
import { Voucher, VoucherSchema } from './entity/voucher.entity';
import { VoucherUser, VoucherUserSchema } from './entity/voucher-user.entity';
import { VoucherUsage } from './entity/voucher-usage.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Voucher.name, schema: VoucherSchema },
      { name: VoucherUser.name, schema: VoucherUserSchema },
      { name: VoucherUsage.name, schema: VoucherUserSchema }
    ]),
  ],
  controllers: [VoucherController],
  providers: [VoucherService],
  exports: [VoucherService, MongooseModule]
})
export class VoucherModule { }

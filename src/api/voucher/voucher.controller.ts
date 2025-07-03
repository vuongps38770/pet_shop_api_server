import { Controller, Get, Query, Post, Body, BadRequestException, Patch, Param } from '@nestjs/common';
import { VoucherService } from './voucher.service';
import { VoucherCreateDto } from './dto/voucher-create.dto';
import { Types } from 'mongoose';
import { CurrentUserId } from 'src/decorators/current-user-id.decorator';

@Controller('voucher')
export class VoucherController {
  constructor(private readonly voucherService: VoucherService) {}


  @Get('active')
  async getActiveVouchers() {
    return this.voucherService.getActiveVouchers();
  }

  @Post('create')
  async createVoucher(@Body() dto: VoucherCreateDto) {
    try {
      return await this.voucherService.createVoucher(dto);
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  @Get('admin-list')
  async getVouchersForAdmin(@Query('page') page = 1, @Query('limit') limit = 10) {
    return this.voucherService.getVouchersForAdmin(Number(page), Number(limit));
  }

  @Patch('deactivate/:id')
  async deactivateVoucher(@Param('id') id: string) {
    const result = await this.voucherService.deactivateVoucher(id);
    if (!result) throw new BadRequestException('Voucher không tồn tại');
    return { message: 'Đã tắt voucher thành công', voucher: result };
  }

  @Post('save')
  async saveVoucherForUser(@Body('voucherId') voucherId: string, @Body('userId') userId: string) {
    await this.voucherService.saveVoucherForUser(new Types.ObjectId(voucherId), new Types.ObjectId(userId));
    return { message: 'Lưu voucher thành công' };
  }

  @Get()
  async getVouchersForUser(
    @CurrentUserId() userId: string,
    @Query('status') status: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.voucherService.getSavedVouchersForUser(
      new Types.ObjectId(userId),
      status,
      Number(page),
      Number(limit),
    );
  }
}

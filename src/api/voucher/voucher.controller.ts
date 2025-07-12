import { Controller, Get, Query, Post, Body, BadRequestException, Patch, Param } from '@nestjs/common';
import { VoucherService } from './voucher.service';
import { VoucherCreateDto } from './dto/voucher-create.dto';
import { Types } from 'mongoose';
import { CurrentUserId } from 'src/decorators/current-user-id.decorator';
import { PartialStandardResponse } from 'src/common/type/standard-api-respond-format';
import { log } from 'console';

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
  async getVouchersForAdmin(@Query('page') page = 1, @Query('limit') limit = 10):Promise<PartialStandardResponse<any>>  {
    const data = await this.voucherService.getVouchersForAdmin(Number(page), Number(limit));
    return {data}
  }

  @Patch('deactivate/:id')
  async deactivateVoucher(@Param('id') id: string) {
    const result = await this.voucherService.deactivateVoucher(id);
    if (!result) throw new BadRequestException('Voucher không tồn tại');
    return { message: 'Đã tắt voucher thành công', voucher: result };
  }

  @Patch('activate/:id')
  async activateVoucher(@Param('id') id: string) {
    const result = await this.voucherService.activateVoucher(id);
    if (!result) throw new BadRequestException('Voucher không tồn tại');
    return { message: 'Đã bật voucher thành công', voucher: result };
  }

  @Post('save')
  async saveVoucherForUser(@Body('voucherId') voucherId: string, @CurrentUserId() userId: string) {
    log(voucherId,userId)
    await this.voucherService.saveVoucherForUser(new Types.ObjectId(voucherId), new Types.ObjectId(userId));
    return { message: 'Lưu voucher thành công' };
  }

  @Get()
  async getVouchersForUser(
    @CurrentUserId() userId: string,
    @Query('status') status: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ):Promise<PartialStandardResponse<any>> {
    const data = await this.voucherService.getSavedVouchersForUser(
      new Types.ObjectId(userId),
      status,
      Number(page),
      Number(limit),
    );
    return {data}
  }

  @Get('for-order')
  async getAvailableVouchersForOrder(@Query('total') total:number, @CurrentUserId() userId:string):Promise<PartialStandardResponse<any>>{
    const data = await this.voucherService.getAvailableVouchersForOrder(total,new Types.ObjectId(userId))
    return {data}
  }

  @Get('hot')
  async getHotVoucher(@CurrentUserId() userId:string):Promise<PartialStandardResponse<any>>{
    const data = await this.voucherService.getHotVoucher(userId)
    return {data}
  }
}

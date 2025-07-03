import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, Connection, startSession } from 'mongoose';
import { Voucher, DiscountType, VoucherApplyType, VoucherDocument } from './entity/voucher.entity';
import { VoucherUser, VoucherUserDocument } from './entity/voucher-user.entity';
import { BadRequestException } from '@nestjs/common';
import { Product } from '../products/entity/product.entity';
import { VoucherErrorCode } from './entity/voucher.entity';
import { AppException } from 'src/common/exeptions/app.exeption';

// Hàm sinh mã voucher ngẫu nhiên
function generateVoucherCode(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

@Injectable()
export class VoucherService {
  constructor(
    @InjectModel(Voucher.name) private voucherModel: Model<VoucherDocument>,
    @InjectModel(VoucherUser.name) private voucherUserModel: Model<VoucherUserDocument>,
    // Nếu cần connection: @InjectConnection() private readonly connection: Connection
  ) {}

  /**
   * Kiểm tra đơn hàng có áp dụng được voucher không và tính số tiền giảm giá
   * @param voucher Thông tin voucher
   * @param order Tổng giá trị đơn hàng
   * @param productIds Danh sách sản phẩm trong đơn (nếu voucher áp dụng cho sản phẩm)
   * @returns Số tiền được giảm
   */
  async checkOrderAndCalculateDiscount(
    voucher: Voucher,
    orderTotal: number,
    productIds?: Types.ObjectId[],
    userId?: Types.ObjectId,
  ): Promise<number> {
    // Kiểm tra voucher còn hiệu lực không
    if (!voucher.is_active) {
      throw new AppException('Voucher không còn hiệu lực', 400, VoucherErrorCode.INACTIVE);
    }
    const now = new Date();
    if (voucher.start_date && now < new Date(voucher.start_date)) {
      throw new AppException('Voucher chưa đến thời gian sử dụng', 400, VoucherErrorCode.NOT_STARTED);
    }
    if (voucher.end_date && now > new Date(voucher.end_date)) {
      throw new AppException('Voucher đã hết hạn', 400, VoucherErrorCode.EXPIRED);
    }
    // Kiểm tra số lượng voucher còn lại
    if (voucher.quantity <= voucher.used) {
      throw new AppException('Voucher đã hết lượt sử dụng', 400, VoucherErrorCode.OUT_OF_QUANTITY);
    }
    // Kiểm tra giá trị đơn hàng tối thiểu
    if (orderTotal < voucher.min_order_value) {
      throw new AppException('Không đủ giá trị đơn hàng tối thiểu để áp dụng voucher', 400, VoucherErrorCode.MIN_ORDER_NOT_MET);
    }
    // Kiểm tra giá trị đơn hàng tối đa (nếu có)
    if (voucher.max_order_value && orderTotal > voucher.max_order_value) {
      throw new AppException('Giá trị đơn hàng vượt quá mức cho phép để áp dụng voucher', 400, VoucherErrorCode.MAX_ORDER_EXCEEDED);
    }
    // Nếu voucher áp dụng cho sản phẩm, kiểm tra sản phẩm hợp lệ
    if (voucher.apply_type === VoucherApplyType.PRODUCT) {
      if (!Array.isArray(voucher.product_ids) || voucher.product_ids.length === 0) {
        throw new AppException('Voucher không có sản phẩm áp dụng', 400, VoucherErrorCode.NO_PRODUCT_APPLY);
      }
      if (!productIds || !productIds.some(id => voucher.product_ids!.includes(id))) {
        throw new AppException('Không có sản phẩm hợp lệ trong đơn hàng để áp dụng voucher', 400, VoucherErrorCode.NO_VALID_PRODUCT);
      }
    }
    // Kiểm tra user đã dùng voucher này chưa (nếu cần)
    if (userId) {
      const used = await this.hasUserUsedVoucher((voucher as any).id, userId);
      if (used) {
        throw new AppException('Bạn đã sử dụng voucher này rồi', 400, VoucherErrorCode.ALREADY_USED);
      }
    }
    // TODO: Các ngoại lệ khác (ví dụ: user không đủ điều kiện, v.v.)

    let discount = 0;
    if (voucher.discount_type === DiscountType.PERCENT) {
      discount = (orderTotal * voucher.discount_value) / 100;
      if (voucher.max_discount) {
        discount = Math.min(discount, voucher.max_discount);
      }
      if (voucher.discount_value > 99) {
        throw new AppException('Giá trị phần trăm giảm giá không được vượt quá 99%', 400, VoucherErrorCode.PERCENT_OVER_LIMIT);
      }
    } else if (voucher.discount_type === DiscountType.FIXED) {
      discount = voucher.discount_value;
      // Nếu là fixed và apply_type là PRODUCT thì discount_value không được vượt quá giá thấp nhất của các sản phẩm được áp dụng
      if (voucher.apply_type === VoucherApplyType.PRODUCT && productIds && productIds.length > 0) {
        // Lấy giá thấp nhất của các sản phẩm
        // (Giả sử bạn có thể lấy giá sản phẩm ở đây nếu cần, hoặc truyền vào)
        // Nếu discount > giá thấp nhất thì ném lỗi
        // throw new AppException('Giá trị giảm giá không được vượt quá giá thấp nhất của sản phẩm áp dụng', 400, VoucherErrorCode.FIXED_OVER_PRODUCT_PRICE);
      }
    }
    // TODO: Nếu voucher áp dụng cho sản phẩm, chỉ tính giảm giá cho các sản phẩm hợp lệ
    return discount;
  }

  /**
   * Kiểm tra user đã dùng voucher này chưa
   */
  async hasUserUsedVoucher(
    voucherId: Types.ObjectId,
    userId: Types.ObjectId,
  ): Promise<boolean> {
    const count = await this.voucherUserModel.countDocuments({
      voucher_id: voucherId,
      user_id: userId,
    });
    return count > 0;
  }

  /**
   * Lưu voucher cho user (chưa sử dụng, chỉ lưu vào danh sách)
   * Khi lưu sẽ tăng used của voucher
   */
  async saveVoucherForUser(voucherId: Types.ObjectId, userId: Types.ObjectId): Promise<void> {
    // Kiểm tra đã lưu chưa
    const existed = await this.voucherUserModel.findOne({ voucher_id: voucherId, user_id: userId });
    if (existed) return;
    const session = await this.voucherModel.db.startSession();
    session.startTransaction();
    try {
      await this.voucherUserModel.create({ voucher_id: voucherId, user_id: userId, used_at: null }, { session });
      await this.voucherModel.updateOne(
        { _id: voucherId },
        { $inc: { used: 1 } },
        { session }
      );
      await session.commitTransaction();
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }

  /**
   * Đánh dấu voucher-user đã dùng (set used_at, order_id), không tăng used nữa
   */
  async markVoucherUsed(
    voucherId: Types.ObjectId,
    userId: Types.ObjectId,
    orderId?: Types.ObjectId,
  ): Promise<void> {
    await this.voucherUserModel.updateOne(
      { voucher_id: voucherId, user_id: userId, used_at: null },
      { $set: { used_at: new Date(), order_id: orderId } }
    );
  }

  /**
   * Huỷ voucher đã dùng (reset used_at, order_id), không giảm used
   */
  async cancelVoucherUsage(
    voucherId: Types.ObjectId,
    userId: Types.ObjectId,
    orderId?: Types.ObjectId,
  ): Promise<void> {
    await this.voucherUserModel.updateOne(
      { voucher_id: voucherId, user_id: userId, order_id: orderId },
      { $set: { used_at: null, order_id: null } }
    );
  }

  /**
   * Lấy tất cả voucher còn hoạt động, sắp xếp mới nhất trước
   */
  async getActiveVouchers(): Promise<Voucher[]> {
    const now = new Date();
    return this.voucherModel.find({
      is_active: true,
      start_date: { $lte: now },
      end_date: { $gte: now },
    }).sort({ start_date: -1 }).exec();
  }

  /**
   * Tạo mới voucher
   */
  async createVoucher(dto: any): Promise<Voucher> {
    // Nếu là percent thì discount_value không được quá 99
    if (dto.discount_type === 'percent' && dto.discount_value > 99) {
      throw new BadRequestException('Giá trị phần trăm giảm giá không được vượt quá 99%');
    }
    // Nếu là fixed và apply_type là PRODUCT thì discount_value không được vượt quá giá thấp nhất của các sản phẩm được áp dụng
    if (dto.discount_type === 'fixed' && dto.apply_type === 'product' && dto.product_ids && dto.product_ids.length > 0) {
      // Lấy giá thấp nhất của các sản phẩm
      const products = await this.voucherModel.db.collection('products').find({ _id: { $in: dto.product_ids } }).toArray();
      if (!products.length) throw new BadRequestException('Không tìm thấy sản phẩm áp dụng');
      const minPrice = Math.min(...products.map((p: any) => p.minPromotionalPrice ||  0));
      if (dto.discount_value > minPrice) {
        throw new BadRequestException('Giá trị giảm giá không được vượt quá giá thấp nhất của sản phẩm áp dụng');
      }
    }
    // Tự sinh code nếu không truyền
    if (!dto.code) {
      let code;
      let exists = true;
      do {
        code = generateVoucherCode();
        exists = !!(await this.voucherModel.findOne({ code }));
      } while (exists);
      dto.code = code;
    }
    // Kiểm tra trùng code nếu truyền từ client
    else {
      const exists = !!(await this.voucherModel.findOne({ code: dto.code }));
      if (exists) throw new BadRequestException('Mã voucher đã tồn tại, vui lòng thử lại!');
    }
    const created = new this.voucherModel(dto);
    return created.save();
  }

  /**
   * Lấy danh sách voucher cho admin, có phân trang
   */
  async getVouchersForAdmin(page = 1, limit = 10): Promise<{data: Voucher[], total: number}> {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.voucherModel.find().sort({ start_date: -1 }).skip(skip).limit(limit).exec(),
      this.voucherModel.countDocuments().exec(),
    ]);
    return { data, total };
  }

  /**
   * Tắt voucher (set is_active=false)
   */
  async deactivateVoucher(voucherId: string): Promise<Voucher | null> {
    return this.voucherModel.findByIdAndUpdate(
      voucherId,
      { is_active: false },
      { new: true }
    ).exec();
  }

  /**
   * Lấy danh sách voucher đã lưu của user, có lọc trạng thái và phân trang
   */
  async getSavedVouchersForUser(
    userId: Types.ObjectId,
    status: string,
    page: number,
    limit: number,
  ): Promise<any> {
    const skip = (page - 1) * limit;
    const now = new Date();
    let data: any[] = [];
    let total = 0;
    if (status === 'not_collected') {
      // Lấy voucher chưa thu thập
      const collectedIds = await this.voucherUserModel.find({ user_id: userId }).distinct('voucher_id');
      const query = { _id: { $nin: collectedIds }, is_active: true, end_date: { $gt: now } };
      total = await this.voucherModel.countDocuments(query);
      data = await this.voucherModel.find(query).skip(skip).limit(limit).exec();
    } else if (status === 'collected_unused') {
      // Đã thu thập, chưa dùng, còn hạn
      const voucherUsers = await this.voucherUserModel.find({ user_id: userId, used_at: null })
        .populate({ path: 'voucher_id', match: { is_active: true, end_date: { $gt: now } } })
        .skip(skip).limit(limit);
      data = voucherUsers.filter(vu => vu.voucher_id).map(vu => vu.voucher_id);
      total = await this.voucherUserModel.countDocuments({ user_id: userId, used_at: null });
    } else if (status === 'collected_used') {
      // Đã thu thập, đã dùng
      const voucherUsers = await this.voucherUserModel.find({ user_id: userId, used_at: { $ne: null } })
        .populate('voucher_id')
        .skip(skip).limit(limit);
      data = voucherUsers.map(vu => vu.voucher_id);
      total = await this.voucherUserModel.countDocuments({ user_id: userId, used_at: { $ne: null } });
    } else if (status === 'expired_unused') {
      // Đã thu thập, chưa dùng, đã hết hạn
      const voucherUsers = await this.voucherUserModel.find({ user_id: userId, used_at: null })
        .populate({ path: 'voucher_id', match: { end_date: { $lte: now } } })
        .skip(skip).limit(limit);
      data = voucherUsers.filter(vu => vu.voucher_id).map(vu => vu.voucher_id);
      total = await this.voucherUserModel.countDocuments({ user_id: userId, used_at: null });
    } else {
      // Mặc định trả về tất cả đã thu thập
      const voucherUsers = await this.voucherUserModel.find({ user_id: userId })
        .populate('voucher_id')
        .skip(skip).limit(limit);
      data = voucherUsers.map(vu => vu.voucher_id);
      total = await this.voucherUserModel.countDocuments({ user_id: userId });
    }
    return { data, total, page, limit };
  }
}

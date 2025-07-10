import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, Connection, startSession } from 'mongoose';
import { Voucher, DiscountType, VoucherApplyType, VoucherDocument } from './entity/voucher.entity';
import { VoucherUser, VoucherUserDocument } from './entity/voucher-user.entity';
import { BadRequestException } from '@nestjs/common';
import { Product } from '../products/entity/product.entity';
import { VoucherErrorCode } from './entity/voucher.entity';
import { AppException } from 'src/common/exeptions/app.exeption';
import { VoucherUsage, VoucherUsageDocument } from './entity/voucher-usage.entity';
import { log } from 'console';
import { match } from 'assert';

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
    @InjectModel(VoucherUsage.name) private voucherUserUsage: Model<VoucherUsageDocument>,
    // Nếu cần connection: @InjectConnection() private readonly connection: Connection
  ) { }

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
        console.log(voucher.max_discount, discount);

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
        // (lấy giá sản phẩm ở đây nếu cần, hoặc truyền vào)
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
      await this.voucherUserModel.create(
        [{ voucher_id: voucherId, user_id: userId }],
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
   * Huỷ voucher đã dùng (reset used_at, order_id), không giảm used
   */
  async cancelVoucherUsage(
    voucherId: Types.ObjectId,
    userId: Types.ObjectId,
    orderId?: Types.ObjectId,
  ): Promise<void> {
    await this.voucherUserUsage.deleteOne({
      voucher_id: voucherId,
      user_id: userId,
      order_id: orderId
    })
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
      const minPrice = Math.min(...products.map((p: any) => p.minPromotionalPrice || 0));
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
  async getVouchersForAdmin(page = 1, limit = 10): Promise<{ data: Voucher[], total: number, hasNextPage: boolean }> {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.voucherModel.find().sort({ start_date: -1 }).skip(skip).limit(limit).exec(),
      this.voucherModel.countDocuments().exec(),
    ]);

    const hasNextPage = page * limit < total;

    return { data, total, hasNextPage };
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
   * Bật voucher (set is_active=true)
   */
  async activateVoucher(voucherId: string): Promise<Voucher | null> {
    return this.voucherModel.findByIdAndUpdate(
      voucherId,
      { is_active: true },
      { new: true }
    ).exec();
  }

  async getSavedVouchersForUser(
    userId: Types.ObjectId,
    status: string,
    page: number,
    limit: number,
  ): Promise<any> {
    const skip = (page - 1) * limit;
    const now = new Date();

  

    if (status === 'not_collected') {
      let data = await this.notCollectedVouchers(userId, skip, limit, page, now)
      return data
    }
    else if (status === 'collected_unused') {
      let raw = await this.collectedUseAbleVouchers(userId, skip, limit, page, now)
      return raw
    }
    else if (status === 'collected_used') {
      let raw = await this.usedVouchers(userId, skip, limit, page, now)
      return raw
    }
    else if (status === 'expired_unused') {

      let raw = await this.collectedAndExpiredUnusedVouchers(userId, skip, limit, page, now)
      return raw
    }
  }
  async collectedAndExpiredUnusedVouchers(
    userId: Types.ObjectId, skip: number,
    limit: number, page: number, curentDate: Date

  ) {
    const pipeline = [
      {
        $match: { user_id: userId }

      },
      {
        $lookup: {
          from: 'voucherusages',
          let: { voucherId: '$voucher_id', userId: '$user_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$voucher_id', '$$voucherId'] },
                    { $eq: ['$user_id', '$$userId'] }
                  ]
                }
              }
            }
          ],
          as: 'usage'
        }

      },
      {
        $lookup: {
          from: 'vouchers',
          localField: 'voucher_id',
          foreignField: '_id',
          as: 'voucher'
        }
      },
      { $unwind: '$voucher' },
      {
        $match: {
          'usage.0': { $exists: false },
          'voucher.end_date': { $lt: new Date() }
        }
      },
      {
        $group: {
          _id: '$voucher._id',
          voucher: { $first: '$voucher' }
        }
      },
      {
        $replaceRoot: { newRoot: '$voucher' }
      }
    ]
    const totalResult = await this.voucherUserModel.aggregate([
      ...pipeline,
      { $count: 'total' },
    ]);
    const total = totalResult[0]?.total || 0;

    const data = await this.voucherUserModel.aggregate([
      ...pipeline,
      { $project: { saved: 0 } }, 
      { $skip: skip },
      { $limit: limit },
    ]);

    return {
      data,
      total,
      page,
      limit,
    };
  }
  async notCollectedVouchers(userId: Types.ObjectId, skip: number,
    limit: number, page: number, curentDate: Date) {
    const pipeline = [
      {
        $match: {
          $and: [
            { 'end_date': { $gt: curentDate } },
            { 'is_active': { $eq: true } }
          ]
        },
      },
      {
        $lookup: {
          from: "voucherusers",
          let: { voucherId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$voucher_id', '$$voucherId'] },
                    { $eq: ['$user_id', userId] }
                  ]
                }
              }
            }
          ],
          as: 'saved'
        }
      },
      {
        $match: {
          'saved.0': { $exists: false },
        }
      },
      {
        $addFields:{
          is_collected: false
        }
      }
    ]
    const totalResult = await this.voucherModel.aggregate([
      ...pipeline,
      { $count: 'total' },
    ]);
    const total = totalResult[0]?.total || 0;

    // Bước 3: Lấy dữ liệu đã phân trang
    const data = await this.voucherModel.aggregate([
      ...pipeline,
      { $project: { saved: 0 } }, // ẩn trường saved
      { $skip: skip },
      { $limit: limit },
    ]);

    return {
      data,
      total,
      page,
      limit,
    };
  }
  async collectedUseAbleVouchers(userId: Types.ObjectId, skip: number,
    limit: number, page: number, curentDate: Date) {
    const pipeline = [
      {
        $match: {
          user_id: userId
        }
      },
      {
        $lookup: {
          from: 'vouchers',
          localField: 'voucher_id',
          foreignField: '_id',
          as: 'voucher'
        }
      },
      { $unwind: '$voucher' },
      {
        $match: {
          $expr: {
            $and: [
              { $gt: ['$voucher.end_date', curentDate] },
              { $eq: ['$voucher.is_active', true] },
              { $gt: ['$voucher.quantity', '$voucher.used'] }
            ]
          }
        }
      },
      {
        $lookup: {
          from: 'voucherusages',
          let: { voucherId: '$voucher._id', userId: '$user_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$voucher_id', '$$voucherId'] },
                    { $eq: ['$user_id', '$$userId'] }
                  ]
                }
              }
            }
          ],
          as: 'usage'
        }
      },
      {
        $addFields: {
          usage_count: { $size: '$usage' }
        }
      },
      {
        $match: {
          $expr: {
            $or: [
              { $not: ['$voucher.max_use_per_user'] },
              { $lt: ['$usage_count', '$voucher.max_use_per_user'] }
            ]
          }
        }
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: [
              '$voucher',
              {
                saved_at: '$saved_at',
                usage_count: '$usage_count'
              }
            ]
          }
        }
      }

    ]


    const totalResult = await this.voucherUserModel.aggregate([
      ...pipeline,
      { $count: 'total' },
    ]);
    const total = totalResult[0]?.total || 0;


    const data = await this.voucherUserModel.aggregate([
      ...pipeline,
      { $skip: skip },
      { $limit: limit },
    ]);

    return {
      data,
      total,
      page,
      limit,
    };
  }
  async usedVouchers(userId: Types.ObjectId, skip: number,
    limit: number, page: number, curentDate: Date) {
    const pipeline = [
      {
        $match: { user_id: { $eq: userId } }
      },
      {
        $lookup: {
          from: 'vouchers',
          foreignField: '_id',
          localField: 'voucher_id',
          as: 'voucher'
        }
      },
      { $unwind: '$voucher' },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: [
              '$voucher', {
                used_at: '$used_at',
                usage_id: '$_id'
              }
            ]
          }
        }
      }


    ]

    const totalResult = await this.voucherUserUsage.aggregate([
      ...pipeline,
      { $count: 'total' },
    ]);
    const total = totalResult[0]?.total || 0;


    const data = await this.voucherUserUsage.aggregate([
      ...pipeline,
      { $skip: skip },
      { $limit: limit },
    ]);

    return {
      data,
      total,
      page,
      limit,
    };
  }

























  async getAvailableVouchersForOrder(totalProductPrice: number, userId: Types.ObjectId) {
    const now = new Date();

    // Lấy tất cả voucher loại đơn hàng còn hoạt động và chưa hết hạn
    const activeVouchers = await this.voucherModel.find({
      is_active: true,
      start_date: { $lte: now },
      end_date: { $gte: now },
      $expr: { $gt: ["$quantity", "$used"] },
      min_order_value: { $lte: totalProductPrice },
      apply_type: VoucherApplyType.ORDER
    }).lean();

    //cái này depcrated vì đã sửa db
    const savedButUnusedVoucherIds = await this.voucherUserModel.find({
      user_id: userId,
      used_at: null
    }).distinct('voucher_id');

    //Lọc activeVoucher để lấy những cái đã lưu nhưng chưa dùng
    const availableVouchers = await this.voucherUserModel.aggregate([
      {
        $match: { user_id: userId }
      },                                          //loc cai da luu theu user id
      {
        $lookup: {
          from: 'vouchers',
          localField: 'voucher_id',
          foreignField: '_id',
          as: 'voucher'
        }
      },                                          //join bang voucher
      {
        $unwind: '$voucher'
      },
      {
        $match: {
          $and: [
            { 'voucher.end_date': { $gt: now } },
            { 'voucher.is_active': { $eq: true } }
          ]
        }                                          //jloc cai nao con han sd
      },
      {
        $lookup: {
          from: 'voucherusages',
          let: { voucherId: '$voucher._id', userId: '$user_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$voucher_id', '$$voucherId'] },
                    { $eq: ['$user_id', '$$userId'] }
                  ]
                }
              }
            }
          ],
          as: 'usages'
        }
      },
      {
        $addFields: {
          usage_count: { $size: '$usages' }
        }
      },
      {
        $match: {
          $expr: {
            $or: [
              { $not: ['$voucher.max_use_per_user'] },
              { $lt: ['$usage_count', '$voucher.max_use_per_user'] }
            ]
          }
        }

      },
      {
        $addFields: {
          usage_exceeded: {
            $cond: [
              { $ifNull: ['$voucher.max_use_per_user', false] },
              { $gte: ['$usage_count', '$voucher.max_use_per_user'] },
              false
            ]
          }
        }
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: [
              '$voucher', {
                usage_count: '$usage_count'
              }
            ]
          }
        }
      }
    ])

    // Tính toán số tiền giảm giá cho từng voucher và sắp xếp
    // const vouchersWithDiscount = await Promise.all(
    //   availableVouchers.map(async (voucher) => {
    //     try {
    //       const discountAmount = await this.CalculateDiscount(
    //         voucher,
    //         totalProductPrice,
    //       );

    //       return {
    //         ...voucher,
    //         calculatedDiscount: discountAmount,
    //         discountPercentage: voucher.discount_type === DiscountType.PERCENT
    //           ? voucher.discount_value
    //           : (discountAmount / totalProductPrice) * 100
    //       };
    //     } catch (error) {
    //       // Nếu voucher không áp dụng được thì bỏ qua
    //       return null;
    //     }
    //   })
    // );

    // // Lọc bỏ voucher null và sắp xếp theo số tiền giảm nhiều nhất
    // const sortedVouchers = vouchersWithDiscount
    //   .filter(voucher => voucher !== null)
    //   .sort((a, b) => b.calculatedDiscount - a.calculatedDiscount);

    return availableVouchers;
  }






  async CalculateDiscount(
    voucher: Voucher,
    orderTotal: number,
  ): Promise<number> {


    let discount = 0;
    if (voucher.discount_type === DiscountType.PERCENT) {
      discount = (orderTotal * voucher.discount_value) / 100;
      if (voucher.max_discount) {
        console.log(voucher.max_discount, discount);

        discount = Math.min(discount, voucher.max_discount);
      }
      if (voucher.discount_value > 99) {
        throw new AppException('Giá trị phần trăm giảm giá không được vượt quá 99%', 400, VoucherErrorCode.PERCENT_OVER_LIMIT);
      }
    } else if (voucher.discount_type === DiscountType.FIXED) {
      discount = voucher.discount_value;
    }
    return discount;
  }


}



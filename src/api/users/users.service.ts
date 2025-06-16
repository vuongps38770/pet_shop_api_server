import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserInfoRespondDto } from './dto/get-user-info.dto';
import { AppException } from 'src/common/exeptions/app.exeption';
import { UserUpdateReqDto } from './dto/update-user.dto';
import { User } from '../auth/entity/user.entity';
import { UserInfoRespondMapper } from './mappers/user-info-respond.mapper';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { PaginationDto } from './dto/pagination.dto';
@Injectable()
export class UsersService {
  constructor(
    @InjectModel('User') private readonly userModel: Model<User>,
    private readonly cloudinaryService: CloudinaryService
  ) { }

  async getUserInfoById(usId: string): Promise<UserInfoRespondDto> {
    const user = await this.userModel.findById(usId)
    if (!user) {
      throw new AppException('User not found!', HttpStatus.NOT_FOUND, 'USER_NOT_FOUND')
    }
    return UserInfoRespondMapper.toDto(user);
  }

  async updateUserInfo(dto: UserUpdateReqDto, usId: string): Promise<UserInfoRespondDto> {
    const newUser = await this.userModel.findByIdAndUpdate<UserInfoRespondDto>(
      usId,
      { ...dto, updatedAt: Date.now() },
      { new: true }
    )
    if (!newUser) {
      throw new AppException('User not found!', HttpStatus.NOT_FOUND, 'USER_NOT_FOUND')
    }
    return UserInfoRespondMapper.toDto(newUser)

  }


  async updateAvatar(usId: string, image: Express.Multer.File): Promise<UserInfoRespondDto> {
    try {
      const user = await this.userModel.findById(usId)
      if (!user) {
        throw new AppException('User not found!', HttpStatus.NOT_FOUND, 'USER_NOT_FOUND')
      }
      const img = await this.cloudinaryService.uploadImage(image)

      const newUser = await this.userModel.findByIdAndUpdate(usId, { avatar: img }, { new: true })
      return UserInfoRespondMapper.toDto(newUser)
    } catch (error) {
      throw new AppException(error, HttpStatus.INTERNAL_SERVER_ERROR)
    }

  }


  async getAllUser(paginationDto: PaginationDto): Promise<any> {
    const { page = 1, limit = 10, search } = paginationDto;
    const skip = (page - 1) * limit;
    const filter: any = {};

    if (search?.trim()) {
      filter.name = { $regex: search.trim(), $options: 'i' };
    }

    const [items, total] = await Promise.all([
      this.userModel.find(filter).skip(skip).limit(limit),
      this.userModel.countDocuments(filter),
    ]);

    return {
      data: items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPreviousPage: page > 1,
    };
  }
}

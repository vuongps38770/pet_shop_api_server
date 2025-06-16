import { Controller, Get, Post, Body, Patch, Param, Delete, UploadedFile, UseInterceptors } from '@nestjs/common';
import { UsersService } from './users.service';
import { CurrentUserId } from 'src/decorators/current-user-id.decorator';
import { UserUpdateReqDto } from './dto/update-user.dto';
import { UserInfoRespondDto } from './dto/get-user-info.dto';
import { PartialStandardResponse } from 'src/common/type/standard-api-respond-format';
import { Public } from 'src/decorators/public.decorator';
import { RawResponse } from 'src/decorators/raw.decorator';
import { log } from 'console';
import { FileInterceptor } from '@nestjs/platform-express';
import { Roles } from 'src/decorators/roles.decorator';
import { UserRole } from '../auth/models/role.enum';
import { PaginationDto } from './dto/pagination.dto';


@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {
  }
  @Get()
  @RawResponse()
  site() {
    return "yo gurt! sybau🥀💔"
  }

  @Get('me')
  async getInfoById(@CurrentUserId() usId: string): Promise<PartialStandardResponse<UserInfoRespondDto>> {
    log(usId)
    const data = await this.usersService.getUserInfoById(usId)
    return {
      data
    }
  }

  @Post('update-info')
  async updateInfoById(@CurrentUserId() usId: string, @Body() userData: UserUpdateReqDto): Promise<PartialStandardResponse<UserInfoRespondDto>> {
    const data = await this.usersService.updateUserInfo(userData, usId)
    return {
      data
    }
  }

  @UseInterceptors(FileInterceptor('file'))
  @Post('update-avatar')
  async updateAvatar(@CurrentUserId() usid: string, @UploadedFile() image: Express.Multer.File): Promise<PartialStandardResponse<UserInfoRespondDto>> {
    const data = await this.usersService.updateAvatar(usid, image)
    return{
      data:data
    }
  }


  @Roles(UserRole.ADMIN)
  @Get('get-all-users')
  async getAllUsers(@Body() page:PaginationDto):Promise<PartialStandardResponse<UserInfoRespondDto>>{
    const data = await this.usersService.getAllUser(page)
    return{
      data:data
    }
  }
  
}

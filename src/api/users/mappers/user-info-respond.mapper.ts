import { UserInfoRespondDto } from '../dto/get-user-info.dto';
import { User } from 'src/api/auth/entity/user.entity';

export class UserInfoRespondMapper {
    static toDto(user: any): UserInfoRespondDto {
        return {
            _id: user._id.toString(),
            name: user.name ?? '',
            surName: user.surName ?? '',
            phone: user.phone ?? '',
            email: user.email ?? '',
            avatar: user.avatar ?? '',
            createdAt:user.createdAt ?? '',
            
        };
    }
}
import { SetMetadata } from '@nestjs/common';

export const RequireAuth = () => SetMetadata('requireAuth', true);
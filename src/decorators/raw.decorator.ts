import { SetMetadata } from '@nestjs/common';

export const RAW_RESPONSE_KEY = 'isRawResponse';
export const RawResponse = () => SetMetadata(RAW_RESPONSE_KEY, true);

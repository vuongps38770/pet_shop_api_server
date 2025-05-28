export interface IStandardApiResponse<T> {
  data?: T | null;
  message?: string;
  code?: number | string;
  success?: boolean
}
export class StandardApiRespondSuccess<T> implements IStandardApiResponse<T> {
  success: true = true; 
  data?: T | null;
  message?: string;
  code?: number;

}
export class PartialStandardResponse<T> {
  data?: T | null;
  message?: string;
  code?: number;

}
export class StandardApiRespondFailure implements IStandardApiResponse<undefined> {
  success: false = false; 
  message?: string;
  code?: number;
  errors: string[]
}

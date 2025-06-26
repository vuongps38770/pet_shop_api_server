export class RatingResDto {
  _id: string;
  user_id: string;
  product_variant_id: string;
  rating: number;
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}

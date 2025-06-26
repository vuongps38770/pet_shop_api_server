export class CreateRatingDto {
  product_variant_id: string;
  rating: number;
  comment?: string;
}

export class UpdateRatingDto {
  rating?: number;
  comment?: string;
}

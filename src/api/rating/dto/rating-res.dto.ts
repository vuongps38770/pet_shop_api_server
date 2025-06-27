export class RatingResDto {
  _id: string;
  user_id: string;
  productId: string;
  rating: number;
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
  isLiked:boolean;
  isDisliked:boolean;
  disLikeList:string[];
  likeList:string[];
  isMine:boolean
}

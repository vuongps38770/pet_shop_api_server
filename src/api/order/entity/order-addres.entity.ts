import { Prop, Schema } from '@nestjs/mongoose';

@Schema({ _id: false }) 
export class OrderAddress {
    @Prop({required:true})
    refId:string
    @Prop({required:true})
    province: string;

    @Prop({required:true})
    district: string;

    @Prop({required:true})
    ward: string;

    @Prop({required:true})
    streetAndNumber: string;

    @Prop({required:true})
    lat: number;

    @Prop({required:true})
    lng: number;

    @Prop({required:true})
    receiverFullname: string;
}
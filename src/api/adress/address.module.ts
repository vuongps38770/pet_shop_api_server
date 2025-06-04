import { Module } from "@nestjs/common";
import { AddressController } from "./address.controller";
import { AddressService } from "./address.service";
import { MongooseModule } from "@nestjs/mongoose";
import { AddressSchema } from "./entity/address.entity";

@Module({
    controllers:[AddressController],
    exports:[AddressService],
    imports:[
        MongooseModule.forFeature([
            {
                name:"Address",
                schema:AddressSchema
            }
        ])
    ],
    providers:[AddressService]
})
export class AddressModule{}
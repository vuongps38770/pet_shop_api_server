import { Controller, Post } from "@nestjs/common";
import { KafkaService } from "./kalfka.service";

@Controller("kk")
export class TestKK{
    constructor(
        private readonly kafkaService: KafkaService
    ){}
    @Post('test')
    async test(){
        await this.kafkaService.sendMessage("media-content-moderation-topic",{data:"hello"})
    }
}
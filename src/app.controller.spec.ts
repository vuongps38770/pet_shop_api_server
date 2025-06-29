import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      const mockRes: any = {
        send: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      appController.getHello(mockRes);
      expect(mockRes.send).toHaveBeenCalledWith('Hello World!');
    });
  });
});

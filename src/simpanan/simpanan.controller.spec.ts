import { Test, TestingModule } from '@nestjs/testing';
import { SimpananController } from './simpanan.controller';
import { SimpananService } from './simpanan.service';

describe('SimpananController', () => {
  let controller: SimpananController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SimpananController],
      providers: [SimpananService],
    }).compile();

    controller = module.get<SimpananController>(SimpananController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

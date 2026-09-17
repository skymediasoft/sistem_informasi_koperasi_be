import { Test, TestingModule } from '@nestjs/testing';
import { SimpananService } from './simpanan.service';

describe('SimpananService', () => {
  let service: SimpananService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SimpananService],
    }).compile();

    service = module.get<SimpananService>(SimpananService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

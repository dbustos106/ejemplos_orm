import { Test, TestingModule } from '@nestjs/testing';
import { VotingCenterService } from './voting-center.service';

describe('VotingCenterService', () => {
  let service: VotingCenterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VotingCenterService],
    }).compile();

    service = module.get<VotingCenterService>(VotingCenterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

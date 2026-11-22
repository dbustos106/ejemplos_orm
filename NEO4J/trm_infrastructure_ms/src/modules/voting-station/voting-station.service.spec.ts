import { Test, TestingModule } from '@nestjs/testing';
import { VotingStationService } from './voting-station.service';

describe('VotingStationService', () => {
  let service: VotingStationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VotingStationService],
    }).compile();

    service = module.get<VotingStationService>(VotingStationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

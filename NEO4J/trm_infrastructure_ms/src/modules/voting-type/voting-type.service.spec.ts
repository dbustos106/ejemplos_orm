import { Test, TestingModule } from '@nestjs/testing';
import { VotingTypeService } from './voting-type.service';

describe('VotingTypeService', () => {
  let service: VotingTypeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VotingTypeService],
    }).compile();

    service = module.get<VotingTypeService>(VotingTypeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

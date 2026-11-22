import { Test, TestingModule } from '@nestjs/testing';
import { VotingStationController } from './voting-station.controller';

describe('VotingStationController', () => {
  let controller: VotingStationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VotingStationController],
    }).compile();

    controller = module.get<VotingStationController>(VotingStationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

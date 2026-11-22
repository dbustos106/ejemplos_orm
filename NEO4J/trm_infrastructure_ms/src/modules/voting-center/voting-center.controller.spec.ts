import { Test, TestingModule } from '@nestjs/testing';
import { VotingCenterController } from './voting-center.controller';

describe('VotingCenterController', () => {
  let controller: VotingCenterController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VotingCenterController],
    }).compile();

    controller = module.get<VotingCenterController>(VotingCenterController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

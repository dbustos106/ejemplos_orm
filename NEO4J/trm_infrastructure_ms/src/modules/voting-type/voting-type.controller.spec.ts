import { Test, TestingModule } from '@nestjs/testing';
import { VotingTypeController } from './voting-type.controller';

describe('VotingTypeController', () => {
  let controller: VotingTypeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VotingTypeController],
    }).compile();

    controller = module.get<VotingTypeController>(VotingTypeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

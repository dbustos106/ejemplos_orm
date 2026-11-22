import { Test, TestingModule } from '@nestjs/testing';
import { WitnessController } from './witness.controller';

describe('WitnessController', () => {
  let controller: WitnessController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WitnessController],
    }).compile();

    controller = module.get<WitnessController>(WitnessController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

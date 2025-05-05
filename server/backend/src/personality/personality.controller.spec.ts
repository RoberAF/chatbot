import { Test, TestingModule } from '@nestjs/testing';
import { PersonalityController } from './personality.controller';

describe('PersonalityController', () => {
  let controller: PersonalityController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PersonalityController],
    }).compile();

    controller = module.get<PersonalityController>(PersonalityController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

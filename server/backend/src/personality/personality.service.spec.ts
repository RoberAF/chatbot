import { Test, TestingModule } from '@nestjs/testing';
import { PersonalityService } from './personality.service';

describe('PersonalityService', () => {
  let service: PersonalityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PersonalityService],
    }).compile();

    service = module.get<PersonalityService>(PersonalityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

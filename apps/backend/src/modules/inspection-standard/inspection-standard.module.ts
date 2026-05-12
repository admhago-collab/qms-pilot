import { Module } from '@nestjs/common';
import { InspectionStandardService } from './inspection-standard.service';
import { InspectionStandardController } from './inspection-standard.controller';

@Module({
  controllers: [InspectionStandardController],
  providers: [InspectionStandardService],
  exports: [InspectionStandardService],
})
export class InspectionStandardModule {}

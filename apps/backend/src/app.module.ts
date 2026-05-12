/**
 * @file app.module.ts
 * @description QMS 백엔드 루트 모듈
 *
 * 전역 설정(ConfigModule)과 DB 연결(PrismaModule)을 등록하고,
 * 각 도메인 모듈을 imports하여 애플리케이션을 구성합니다.
 */
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma';
import { InspectionModule } from './modules/inspection';
import { NonconformanceModule } from './modules/nonconformance';
import { ApqpModule } from './modules/apqp';
import { PpapModule } from './modules/ppap';
import { DvpModule } from './modules/dvp';
import { InitialSampleModule } from './modules/initial-sample';
import { ComplaintModule } from './modules/complaint';
import { WarrantyModule } from './modules/warranty';
import { FieldAnalysisModule } from './modules/field-analysis';
import { RecallModule } from './modules/recall';
import { CapaModule } from './modules/capa';
import { CertificateModule } from './modules/certificate';
import { EquipmentModule } from './modules/equipment';
import { TraceabilityModule } from './modules/traceability';
import { MasterModule } from './modules/master';
import { SupplierModule } from './modules/supplier';
import { HrModule } from './modules/hr';
import { ChangeModule } from './modules/change';
import { InspectionStandardModule } from './modules/inspection-standard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    InspectionModule,
    NonconformanceModule,
    ApqpModule,
    PpapModule,
    DvpModule,
    InitialSampleModule,
    ComplaintModule,
    WarrantyModule,
    FieldAnalysisModule,
    RecallModule,
    CapaModule,
    CertificateModule,
    EquipmentModule,
    TraceabilityModule,
    MasterModule,
    SupplierModule,
    HrModule,
    ChangeModule,
    InspectionStandardModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

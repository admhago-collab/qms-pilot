/**
 * @file prisma.service.ts
 * @description Prisma 클라이언트 서비스 - DB 연결 관리
 * 초보자 가이드: NestJS 생명주기에 맞춰 Prisma 클라이언트의 연결/해제를 자동 관리한다.
 * Prisma 7.x는 adapter 패턴을 사용하므로 @prisma/adapter-pg + pg를 통해 PostgreSQL에 연결한다.
 */
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private pool: pg.Pool;
  private client: any;

  constructor() {
    const connectionString = process.env.DATABASE_URL
      || 'postgresql://qms_user:qms_password@localhost:5432/qmsdb?schema=public';

    this.pool = new pg.Pool({ connectionString });
    const adapter = new PrismaPg(this.pool as any);
    this.client = new (PrismaClient as any)({ adapter });
  }

  async onModuleInit() {
    await this.client.$connect();
  }

  async onModuleDestroy() {
    await this.client.$disconnect();
    await this.pool.end();
  }

  get inspectionLot(): any { return this.client.inspectionLot; }
  get inspectionResult(): any { return this.client.inspectionResult; }
  get ncr(): any { return this.client.ncr; }
  get mrbReview(): any { return this.client.mrbReview; }
  get apqpProject(): any { return this.client.apqpProject; }
  get apqpPhase(): any { return this.client.apqpPhase; }
  get gateDeliverable(): any { return this.client.gateDeliverable; }
  get ppapSubmission(): any { return this.client.ppapSubmission; }
  get ppapDocument(): any { return this.client.ppapDocument; }
  get ppapApprovalHistory(): any { return this.client.ppapApprovalHistory; }
  get dvpPlan(): any { return this.client.dvpPlan; }
  get dvpResult(): any { return this.client.dvpResult; }
  get initialSample(): any { return this.client.initialSample; }
  get sampleInspectionItem(): any { return this.client.sampleInspectionItem; }
  get customerComplaint(): any { return this.client.customerComplaint; }
  get warrantyRecord(): any { return this.client.warrantyRecord; }
  get fieldFailure(): any { return this.client.fieldFailure; }
  get recallCampaign(): any { return this.client.recallCampaign; }
  get recallLot(): any { return this.client.recallLot; }
  get capa(): any { return this.client.capa; }
  get effectivenessCheck(): any { return this.client.effectivenessCheck; }
  get inspectionCertificate(): any { return this.client.inspectionCertificate; }
  get certificateTemplate(): any { return this.client.certificateTemplate; }
  get equipment(): any { return this.client.equipment; }
  get calibration(): any { return this.client.calibration; }
  get lotTrace(): any { return this.client.lotTrace; }
  get customer(): any { return this.client.customer; }
  get item(): any { return this.client.item; }
  get processInfo(): any { return this.client.processInfo; }
  get commonCode(): any { return this.client.commonCode; }
  get supplierEvaluation(): any { return this.client.supplierEvaluation; }
  get scar(): any { return this.client.scar; }
  get employeeCompetency(): any { return this.client.employeeCompetency; }
  get trainingRecord(): any { return this.client.trainingRecord; }
  get changeRequest(): any { return this.client.changeRequest; }
  get inspectionStandard(): any { return this.client.inspectionStandard; }
  get inspectionStandardItem(): any { return this.client.inspectionStandardItem; }

  $queryRaw(...args: any[]) {
    return (this.client.$queryRaw as any)(...args);
  }

  $queryRawUnsafe(...args: any[]) {
    return (this.client.$queryRawUnsafe as any)(...args);
  }

  $transaction(...args: any[]) {
    return (this.client.$transaction as any)(...args);
  }
}

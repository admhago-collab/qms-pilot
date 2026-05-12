# 검사기준서 관리 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 검사관리 메뉴에 공급업체+품목 복합키 기반 검사기준서 관리 기능을 추가하고, IQC/IPQC/FQC/OQC 검사 시 기준서 항목을 자동으로 불러온다.

**Architecture:** NestJS 백엔드에 `inspection-standard` 모듈을 신규 추가하고, Prisma 스키마에 두 개의 테이블(`QMS_INSPECTION_STANDARD`, `QMS_INSPECTION_STANDARD_ITEM`)을 추가한다. 프론트엔드는 Zustand 스토어 + Next.js App Router 패턴을 그대로 따른다. 기존 `InspectionForm`에 "기준서 불러오기" 버튼을 추가해 자동 연계한다.

**Tech Stack:** NestJS 11, Prisma 7, PostgreSQL, Next.js 15 (App Router), Zustand, Tailwind CSS, TypeScript

---

## 파일 구조

### 신규 생성
```
apps/backend/src/modules/inspection-standard/
  entities/
    inspection-standard.entity.ts      # 백엔드 enum 정의
    index.ts
  dto/
    create-standard.dto.ts
    update-standard.dto.ts
    standard-query.dto.ts
    create-standard-item.dto.ts
    update-standard-item.dto.ts
    index.ts
  inspection-standard.service.ts
  inspection-standard.controller.ts
  inspection-standard.module.ts
  index.ts

apps/frontend/src/
  types/inspection-standard.ts
  stores/inspection-standard-store.ts
  components/inspection-standard/
    inspection-standard-table.tsx
    inspection-standard-form.tsx
    inspection-standard-item-form.tsx
    inspection-standard-detail.tsx
    inspection-standard-page-content.tsx
    index.ts
  app/(dashboard)/inspection/standards/
    page.tsx
```

### 수정
```
apps/backend/prisma/schema.prisma                         # enum 2개 + model 2개 추가
apps/backend/src/app.module.ts                            # InspectionStandardModule 등록
apps/frontend/src/types/index.ts                          # inspection-standard export 추가
apps/frontend/src/stores/index.ts                         # inspection-standard-store export 추가
apps/frontend/src/components/layout/sidebar.tsx           # 검사기준서 관리 메뉴 추가
apps/frontend/src/components/inspection/inspection-form.tsx # 기준서 불러오기 버튼 추가
```

---

## Task 1: Prisma 스키마 + 마이그레이션

**Files:**
- Modify: `apps/backend/prisma/schema.prisma`

- [ ] **Step 1: schema.prisma에 enum 2개 추가**

`apps/backend/prisma/schema.prisma` 파일에서 기존 enum 블록들 끝(ChangeStatus enum 아래)에 다음을 추가한다:

```prisma
enum InspectionStandardStatus {
  DRAFT
  ACTIVE
  SUPERSEDED
  INACTIVE
}

enum InputType {
  NONE
  NUMERIC
  ATTACHMENT
  TEXT
}
```

- [ ] **Step 2: schema.prisma에 model 2개 추가**

파일 맨 끝(ChangeRequest model 아래)에 다음을 추가한다:

```prisma
/// 36. 검사기준서
model InspectionStandard {
  standardId    String                   @id @default(uuid()) @map("STANDARD_ID") @db.VarChar(50)
  standardNo    String                   @unique @map("STANDARD_NO") @db.VarChar(50)
  supplierCode  String                   @map("SUPPLIER_CODE") @db.VarChar(50)
  supplierName  String?                  @map("SUPPLIER_NAME") @db.VarChar(200)
  itemCode      String                   @map("ITEM_CODE") @db.VarChar(50)
  itemName      String?                  @map("ITEM_NAME") @db.VarChar(200)
  version       Int                      @default(1) @map("VERSION")
  status        InspectionStandardStatus @default(DRAFT) @map("STATUS")
  effectiveDate DateTime?                @map("EFFECTIVE_DATE")
  expiryDate    DateTime?                @map("EXPIRY_DATE")
  approvedBy    String?                  @map("APPROVED_BY") @db.VarChar(100)
  approvedDate  DateTime?                @map("APPROVED_DATE")
  remarks       String?                  @map("REMARKS") @db.VarChar(2000)

  createdAt DateTime  @default(now()) @map("CREATED_AT")
  updatedAt DateTime  @updatedAt @map("UPDATED_AT")
  deletedAt DateTime? @map("DELETED_AT")
  createdBy String?   @map("CREATED_BY") @db.VarChar(100)
  updatedBy String?   @map("UPDATED_BY") @db.VarChar(100)

  items InspectionStandardItem[]

  @@map("QMS_INSPECTION_STANDARD")
}

/// 37. 검사기준서 항목
model InspectionStandardItem {
  standardItemId      String    @id @default(uuid()) @map("STANDARD_ITEM_ID") @db.VarChar(50)
  standardId          String    @map("STANDARD_ID") @db.VarChar(50)
  sequenceNo          Int       @default(1) @map("SEQUENCE_NO")
  characteristicName  String    @map("CHARACTERISTIC_NAME") @db.VarChar(200)
  characteristicNo    String?   @map("CHARACTERISTIC_NO") @db.VarChar(50)
  applicableTypes     String?   @map("APPLICABLE_TYPES") @db.VarChar(100)
  inputType           InputType @default(NONE) @map("INPUT_TYPE")
  specMin             Decimal?  @map("SPEC_MIN") @db.Decimal(18, 6)
  specMax             Decimal?  @map("SPEC_MAX") @db.Decimal(18, 6)
  specText            String?   @map("SPEC_TEXT") @db.VarChar(500)
  unit                String?   @map("UNIT") @db.VarChar(20)
  isCritical          Boolean   @default(false) @map("IS_CRITICAL")
  inspectionMethod    String?   @map("INSPECTION_METHOD") @db.VarChar(200)
  inspectionEquipment String?   @map("INSPECTION_EQUIPMENT") @db.VarChar(200)
  samplingLevel       String?   @map("SAMPLING_LEVEL") @db.VarChar(20)
  aqlLevel            String?   @map("AQL_LEVEL") @db.VarChar(20)
  remarks             String?   @map("REMARKS") @db.VarChar(2000)

  createdAt DateTime  @default(now()) @map("CREATED_AT")
  updatedAt DateTime  @updatedAt @map("UPDATED_AT")
  deletedAt DateTime? @map("DELETED_AT")
  createdBy String?   @map("CREATED_BY") @db.VarChar(100)
  updatedBy String?   @map("UPDATED_BY") @db.VarChar(100)

  standard InspectionStandard @relation(fields: [standardId], references: [standardId], onDelete: Cascade)

  @@map("QMS_INSPECTION_STANDARD_ITEM")
}
```

- [ ] **Step 3: 마이그레이션 실행**

```bash
cd apps/backend
pnpm prisma migrate dev --name add_inspection_standard
```

Expected output:
```
✔ Generated Prisma Client
The following migration(s) have been created and applied...
migrations/
  └─ YYYYMMDDHHMMSS_add_inspection_standard/
       └─ migration.sql
```

- [ ] **Step 4: Prisma 클라이언트 생성 확인**

```bash
pnpm prisma generate
```

Expected: `✔ Generated Prisma Client`

- [ ] **Step 5: 커밋**

```bash
cd ../..
git add apps/backend/prisma/schema.prisma apps/backend/prisma/migrations/
git commit -m "feat: add InspectionStandard prisma schema and migration"
```

---

## Task 2: 백엔드 엔티티 & DTO

**Files:**
- Create: `apps/backend/src/modules/inspection-standard/entities/inspection-standard.entity.ts`
- Create: `apps/backend/src/modules/inspection-standard/entities/index.ts`
- Create: `apps/backend/src/modules/inspection-standard/dto/create-standard.dto.ts`
- Create: `apps/backend/src/modules/inspection-standard/dto/update-standard.dto.ts`
- Create: `apps/backend/src/modules/inspection-standard/dto/standard-query.dto.ts`
- Create: `apps/backend/src/modules/inspection-standard/dto/create-standard-item.dto.ts`
- Create: `apps/backend/src/modules/inspection-standard/dto/update-standard-item.dto.ts`
- Create: `apps/backend/src/modules/inspection-standard/dto/index.ts`

- [ ] **Step 1: 엔티티 enum 파일 생성**

`apps/backend/src/modules/inspection-standard/entities/inspection-standard.entity.ts`:

```typescript
export enum InspectionStandardStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  SUPERSEDED = 'SUPERSEDED',
  INACTIVE = 'INACTIVE',
}

export enum InputType {
  NONE = 'NONE',
  NUMERIC = 'NUMERIC',
  ATTACHMENT = 'ATTACHMENT',
  TEXT = 'TEXT',
}
```

- [ ] **Step 2: 엔티티 index.ts 생성**

`apps/backend/src/modules/inspection-standard/entities/index.ts`:

```typescript
export * from './inspection-standard.entity';
```

- [ ] **Step 3: CreateStandardDto 생성**

`apps/backend/src/modules/inspection-standard/dto/create-standard.dto.ts`:

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateStandardDto {
  @ApiProperty({ description: '공급업체 코드', example: 'SUP-001' })
  @IsString()
  supplierCode: string;

  @ApiPropertyOptional({ description: '공급업체명', example: '삼성부품' })
  @IsOptional()
  @IsString()
  supplierName?: string;

  @ApiProperty({ description: '품목 코드', example: 'ITEM-001' })
  @IsString()
  itemCode: string;

  @ApiPropertyOptional({ description: '품목명', example: '볼트M6' })
  @IsOptional()
  @IsString()
  itemName?: string;

  @ApiPropertyOptional({ description: '적용 시작일', example: '2026-01-01' })
  @IsOptional()
  @IsDateString()
  effectiveDate?: string;

  @ApiPropertyOptional({ description: '만료일', example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @ApiPropertyOptional({ description: '비고' })
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiPropertyOptional({ description: '생성자', example: 'admin' })
  @IsOptional()
  @IsString()
  createdBy?: string;
}
```

- [ ] **Step 4: UpdateStandardDto 생성**

`apps/backend/src/modules/inspection-standard/dto/update-standard.dto.ts`:

```typescript
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString } from 'class-validator';

export class UpdateStandardDto {
  @ApiPropertyOptional({ description: '공급업체명' })
  @IsOptional()
  @IsString()
  supplierName?: string;

  @ApiPropertyOptional({ description: '품목명' })
  @IsOptional()
  @IsString()
  itemName?: string;

  @ApiPropertyOptional({ description: '적용 시작일' })
  @IsOptional()
  @IsDateString()
  effectiveDate?: string;

  @ApiPropertyOptional({ description: '만료일' })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @ApiPropertyOptional({ description: '비고' })
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiPropertyOptional({ description: '수정자' })
  @IsOptional()
  @IsString()
  updatedBy?: string;
}
```

- [ ] **Step 5: StandardQueryDto 생성**

`apps/backend/src/modules/inspection-standard/dto/standard-query.dto.ts`:

```typescript
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { InspectionStandardStatus } from '../entities';

export class StandardQueryDto {
  @ApiPropertyOptional({ description: '공급업체 코드' })
  @IsOptional()
  @IsString()
  supplierCode?: string;

  @ApiPropertyOptional({ description: '품목 코드' })
  @IsOptional()
  @IsString()
  itemCode?: string;

  @ApiPropertyOptional({ enum: InspectionStandardStatus })
  @IsOptional()
  @IsEnum(InspectionStandardStatus)
  status?: InspectionStandardStatus;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
```

- [ ] **Step 6: CreateStandardItemDto 생성**

`apps/backend/src/modules/inspection-standard/dto/create-standard-item.dto.ts`:

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsArray,
  IsInt,
  Min,
} from 'class-validator';
import { InputType } from '../entities';

export class CreateStandardItemDto {
  @ApiPropertyOptional({ description: '순번', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  sequenceNo?: number;

  @ApiProperty({ description: '특성명', example: '외경치수' })
  @IsString()
  characteristicName: string;

  @ApiPropertyOptional({ description: '특성 번호', example: 'D-01' })
  @IsOptional()
  @IsString()
  characteristicNo?: string;

  @ApiPropertyOptional({
    description: '적용 검사 유형 (null = 전체)',
    example: ['IQC', 'FQC'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicableTypes?: string[] | null;

  @ApiProperty({ enum: InputType, description: '입력구분', example: InputType.NUMERIC })
  @IsEnum(InputType)
  inputType: InputType;

  @ApiPropertyOptional({ description: '규격 하한', example: 5.9 })
  @IsOptional()
  @IsNumber()
  specMin?: number;

  @ApiPropertyOptional({ description: '규격 상한', example: 6.1 })
  @IsOptional()
  @IsNumber()
  specMax?: number;

  @ApiPropertyOptional({ description: '규격 텍스트', example: '스크래치 없을 것' })
  @IsOptional()
  @IsString()
  specText?: string;

  @ApiPropertyOptional({ description: '단위', example: 'mm' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({ description: '중요 특성 여부', default: false })
  @IsOptional()
  @IsBoolean()
  isCritical?: boolean;

  @ApiPropertyOptional({ description: '검사 방법', example: '마이크로미터' })
  @IsOptional()
  @IsString()
  inspectionMethod?: string;

  @ApiPropertyOptional({ description: '검사 장비', example: '버니어캘리퍼스' })
  @IsOptional()
  @IsString()
  inspectionEquipment?: string;

  @ApiPropertyOptional({ description: '샘플링 수준', example: 'II' })
  @IsOptional()
  @IsString()
  samplingLevel?: string;

  @ApiPropertyOptional({ description: 'AQL 값', example: '1.0' })
  @IsOptional()
  @IsString()
  aqlLevel?: string;

  @ApiPropertyOptional({ description: '비고' })
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiPropertyOptional({ description: '생성자' })
  @IsOptional()
  @IsString()
  createdBy?: string;
}
```

- [ ] **Step 7: UpdateStandardItemDto 생성**

`apps/backend/src/modules/inspection-standard/dto/update-standard-item.dto.ts`:

```typescript
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsArray,
  IsInt,
  Min,
} from 'class-validator';
import { InputType } from '../entities';

export class UpdateStandardItemDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  sequenceNo?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  characteristicName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  characteristicNo?: string;

  @ApiPropertyOptional({ type: [String], nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicableTypes?: string[] | null;

  @ApiPropertyOptional({ enum: InputType })
  @IsOptional()
  @IsEnum(InputType)
  inputType?: InputType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  specMin?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  specMax?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  specText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isCritical?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  inspectionMethod?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  inspectionEquipment?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  samplingLevel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  aqlLevel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  updatedBy?: string;
}
```

- [ ] **Step 8: DTO index.ts 생성**

`apps/backend/src/modules/inspection-standard/dto/index.ts`:

```typescript
export { CreateStandardDto } from './create-standard.dto';
export { UpdateStandardDto } from './update-standard.dto';
export { StandardQueryDto } from './standard-query.dto';
export { CreateStandardItemDto } from './create-standard-item.dto';
export { UpdateStandardItemDto } from './update-standard-item.dto';
```

- [ ] **Step 9: 타입 체크**

```bash
cd apps/backend
pnpm type-check
```

Expected: 에러 없음

- [ ] **Step 10: 커밋**

```bash
cd ../..
git add apps/backend/src/modules/inspection-standard/
git commit -m "feat: add inspection-standard entities and DTOs"
```

---

## Task 3: 백엔드 서비스

**Files:**
- Create: `apps/backend/src/modules/inspection-standard/inspection-standard.service.ts`

- [ ] **Step 1: 서비스 파일 생성**

`apps/backend/src/modules/inspection-standard/inspection-standard.service.ts`:

```typescript
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma';
import { InspectionStandardStatus } from './entities';
import {
  CreateStandardDto,
  UpdateStandardDto,
  StandardQueryDto,
  CreateStandardItemDto,
  UpdateStandardItemDto,
} from './dto';

@Injectable()
export class InspectionStandardService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateStandardDto) {
    const standardNo = this.generateStandardNo();

    const maxVersionRecord = await this.prisma.inspectionStandard.findFirst({
      where: {
        supplierCode: dto.supplierCode,
        itemCode: dto.itemCode,
        deletedAt: null,
      },
      orderBy: { version: 'desc' },
      select: { version: true },
    });

    const version = maxVersionRecord ? maxVersionRecord.version + 1 : 1;

    return this.prisma.inspectionStandard.create({
      data: {
        standardNo,
        supplierCode: dto.supplierCode,
        supplierName: dto.supplierName,
        itemCode: dto.itemCode,
        itemName: dto.itemName,
        version,
        status: InspectionStandardStatus.DRAFT,
        effectiveDate: dto.effectiveDate ? new Date(dto.effectiveDate) : null,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
        remarks: dto.remarks,
        createdBy: dto.createdBy,
      },
      include: { items: { where: { deletedAt: null }, orderBy: { sequenceNo: 'asc' } } },
    });
  }

  async findAll(query: StandardQueryDto) {
    const { supplierCode, itemCode, status, page = 1, limit = 20 } = query;

    const where: any = { deletedAt: null };
    if (supplierCode) where.supplierCode = { contains: supplierCode };
    if (itemCode) where.itemCode = { contains: itemCode };
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      this.prisma.inspectionStandard.findMany({
        where,
        orderBy: [{ supplierCode: 'asc' }, { itemCode: 'asc' }, { version: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: { select: { items: { where: { deletedAt: null } } } },
        },
      }),
      this.prisma.inspectionStandard.count({ where }),
    ]);

    return {
      items: items.map((s) => ({ ...s, itemCount: s._count.items, _count: undefined })),
      total,
      page,
      limit,
    };
  }

  async findOne(standardId: string) {
    const standard = await this.prisma.inspectionStandard.findFirst({
      where: { standardId, deletedAt: null },
      include: {
        items: {
          where: { deletedAt: null },
          orderBy: { sequenceNo: 'asc' },
        },
      },
    });

    if (!standard) {
      throw new NotFoundException(`Inspection standard '${standardId}' not found`);
    }

    return this.deserializeItems(standard);
  }

  async update(standardId: string, dto: UpdateStandardDto) {
    const standard = await this.findOne(standardId);

    if (standard.status !== InspectionStandardStatus.DRAFT) {
      throw new BadRequestException('Only DRAFT standards can be modified');
    }

    return this.prisma.inspectionStandard.update({
      where: { standardId },
      data: {
        supplierName: dto.supplierName,
        itemName: dto.itemName,
        effectiveDate: dto.effectiveDate ? new Date(dto.effectiveDate) : undefined,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
        remarks: dto.remarks,
        updatedBy: dto.updatedBy,
      },
    });
  }

  async activate(standardId: string, approvedBy?: string) {
    const standard = await this.findOne(standardId);

    if (standard.status !== InspectionStandardStatus.DRAFT) {
      throw new BadRequestException('Only DRAFT standards can be activated');
    }

    await this.prisma.inspectionStandard.updateMany({
      where: {
        supplierCode: standard.supplierCode,
        itemCode: standard.itemCode,
        status: InspectionStandardStatus.ACTIVE,
        deletedAt: null,
      },
      data: { status: InspectionStandardStatus.SUPERSEDED },
    });

    return this.prisma.inspectionStandard.update({
      where: { standardId },
      data: {
        status: InspectionStandardStatus.ACTIVE,
        approvedBy: approvedBy ?? null,
        approvedDate: new Date(),
      },
      include: { items: { where: { deletedAt: null }, orderBy: { sequenceNo: 'asc' } } },
    });
  }

  async createNewVersion(standardId: string, createdBy?: string) {
    const source = await this.findOne(standardId);

    const maxVersionRecord = await this.prisma.inspectionStandard.findFirst({
      where: {
        supplierCode: source.supplierCode,
        itemCode: source.itemCode,
        deletedAt: null,
      },
      orderBy: { version: 'desc' },
      select: { version: true },
    });

    const newVersion = maxVersionRecord ? maxVersionRecord.version + 1 : source.version + 1;
    const newStandardNo = this.generateStandardNo();

    const newStandard = await this.prisma.inspectionStandard.create({
      data: {
        standardNo: newStandardNo,
        supplierCode: source.supplierCode,
        supplierName: source.supplierName,
        itemCode: source.itemCode,
        itemName: source.itemName,
        version: newVersion,
        status: InspectionStandardStatus.DRAFT,
        effectiveDate: source.effectiveDate,
        expiryDate: source.expiryDate,
        remarks: source.remarks,
        createdBy,
      },
    });

    if (source.items && source.items.length > 0) {
      await this.prisma.inspectionStandardItem.createMany({
        data: source.items.map((item: any) => ({
          standardId: newStandard.standardId,
          sequenceNo: item.sequenceNo,
          characteristicName: item.characteristicName,
          characteristicNo: item.characteristicNo,
          applicableTypes: item.applicableTypes
            ? JSON.stringify(item.applicableTypes)
            : null,
          inputType: item.inputType,
          specMin: item.specMin,
          specMax: item.specMax,
          specText: item.specText,
          unit: item.unit,
          isCritical: item.isCritical,
          inspectionMethod: item.inspectionMethod,
          inspectionEquipment: item.inspectionEquipment,
          samplingLevel: item.samplingLevel,
          aqlLevel: item.aqlLevel,
          remarks: item.remarks,
          createdBy,
        })),
      });
    }

    return this.findOne(newStandard.standardId);
  }

  async addItem(standardId: string, dto: CreateStandardItemDto) {
    await this.findOne(standardId);

    const maxSeq = await this.prisma.inspectionStandardItem.findFirst({
      where: { standardId, deletedAt: null },
      orderBy: { sequenceNo: 'desc' },
      select: { sequenceNo: true },
    });

    const sequenceNo = dto.sequenceNo ?? (maxSeq ? maxSeq.sequenceNo + 1 : 1);

    const item = await this.prisma.inspectionStandardItem.create({
      data: {
        standardId,
        sequenceNo,
        characteristicName: dto.characteristicName,
        characteristicNo: dto.characteristicNo,
        applicableTypes: dto.applicableTypes ? JSON.stringify(dto.applicableTypes) : null,
        inputType: dto.inputType,
        specMin: dto.specMin,
        specMax: dto.specMax,
        specText: dto.specText,
        unit: dto.unit,
        isCritical: dto.isCritical ?? false,
        inspectionMethod: dto.inspectionMethod,
        inspectionEquipment: dto.inspectionEquipment,
        samplingLevel: dto.samplingLevel,
        aqlLevel: dto.aqlLevel,
        remarks: dto.remarks,
        createdBy: dto.createdBy,
      },
    });

    return this.deserializeItem(item);
  }

  async updateItem(standardId: string, standardItemId: string, dto: UpdateStandardItemDto) {
    const item = await this.prisma.inspectionStandardItem.findFirst({
      where: { standardItemId, standardId, deletedAt: null },
    });

    if (!item) {
      throw new NotFoundException(`Item '${standardItemId}' not found`);
    }

    const updated = await this.prisma.inspectionStandardItem.update({
      where: { standardItemId },
      data: {
        sequenceNo: dto.sequenceNo,
        characteristicName: dto.characteristicName,
        characteristicNo: dto.characteristicNo,
        applicableTypes:
          dto.applicableTypes !== undefined
            ? dto.applicableTypes === null
              ? null
              : JSON.stringify(dto.applicableTypes)
            : undefined,
        inputType: dto.inputType,
        specMin: dto.specMin,
        specMax: dto.specMax,
        specText: dto.specText,
        unit: dto.unit,
        isCritical: dto.isCritical,
        inspectionMethod: dto.inspectionMethod,
        inspectionEquipment: dto.inspectionEquipment,
        samplingLevel: dto.samplingLevel,
        aqlLevel: dto.aqlLevel,
        remarks: dto.remarks,
        updatedBy: dto.updatedBy,
      },
    });

    return this.deserializeItem(updated);
  }

  async deleteItem(standardId: string, standardItemId: string, deletedBy?: string) {
    const item = await this.prisma.inspectionStandardItem.findFirst({
      where: { standardItemId, standardId, deletedAt: null },
    });

    if (!item) {
      throw new NotFoundException(`Item '${standardItemId}' not found`);
    }

    await this.prisma.inspectionStandardItem.update({
      where: { standardItemId },
      data: { deletedAt: new Date(), updatedBy: deletedBy },
    });
  }

  async findActive(supplierCode: string, itemCode: string, inspectionType?: string) {
    const standard = await this.prisma.inspectionStandard.findFirst({
      where: {
        supplierCode,
        itemCode,
        status: InspectionStandardStatus.ACTIVE,
        deletedAt: null,
      },
      include: {
        items: {
          where: { deletedAt: null },
          orderBy: { sequenceNo: 'asc' },
        },
      },
    });

    if (!standard) return null;

    const deserialized = this.deserializeItems(standard);

    if (!inspectionType) return deserialized;

    return {
      ...deserialized,
      items: deserialized.items.filter(
        (item: any) =>
          !item.applicableTypes || item.applicableTypes.includes(inspectionType),
      ),
    };
  }

  private deserializeItems(standard: any) {
    return {
      ...standard,
      items: (standard.items ?? []).map((item: any) => this.deserializeItem(item)),
    };
  }

  private deserializeItem(item: any) {
    return {
      ...item,
      applicableTypes: item.applicableTypes
        ? JSON.parse(item.applicableTypes)
        : null,
    };
  }

  private generateStandardNo(): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `IS-${dateStr}-${random}`;
  }
}
```

- [ ] **Step 2: 타입 체크**

```bash
cd apps/backend
pnpm type-check
```

Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
cd ../..
git add apps/backend/src/modules/inspection-standard/inspection-standard.service.ts
git commit -m "feat: add InspectionStandardService"
```

---

## Task 4: 백엔드 컨트롤러 + 모듈 + App 등록

**Files:**
- Create: `apps/backend/src/modules/inspection-standard/inspection-standard.controller.ts`
- Create: `apps/backend/src/modules/inspection-standard/inspection-standard.module.ts`
- Create: `apps/backend/src/modules/inspection-standard/index.ts`
- Modify: `apps/backend/src/app.module.ts`

- [ ] **Step 1: 컨트롤러 생성**

`apps/backend/src/modules/inspection-standard/inspection-standard.controller.ts`:

> 주의: `@Get('active')` 라우트는 반드시 `@Get(':id')` 보다 먼저 정의해야 NestJS가 올바르게 매칭한다.

```typescript
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { InspectionStandardService } from './inspection-standard.service';
import {
  CreateStandardDto,
  UpdateStandardDto,
  StandardQueryDto,
  CreateStandardItemDto,
  UpdateStandardItemDto,
} from './dto';

@ApiTags('InspectionStandard')
@Controller('inspection-standards')
export class InspectionStandardController {
  constructor(private readonly service: InspectionStandardService) {}

  @Get('active')
  @ApiOperation({ summary: '공급업체+품목+검사유형으로 ACTIVE 기준서 조회 (자동 불러오기용)' })
  @ApiQuery({ name: 'supplierCode', required: true })
  @ApiQuery({ name: 'itemCode', required: true })
  @ApiQuery({ name: 'inspectionType', required: false })
  async findActive(
    @Query('supplierCode') supplierCode: string,
    @Query('itemCode') itemCode: string,
    @Query('inspectionType') inspectionType?: string,
  ) {
    return this.service.findActive(supplierCode, itemCode, inspectionType);
  }

  @Get()
  @ApiOperation({ summary: '검사기준서 목록 조회' })
  async findAll(@Query() query: StandardQueryDto) {
    return this.service.findAll(query);
  }

  @Post()
  @ApiOperation({ summary: '검사기준서 등록' })
  async create(@Body() dto: CreateStandardDto) {
    return this.service.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: '검사기준서 상세 조회' })
  @ApiParam({ name: 'id', description: 'standardId' })
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: '검사기준서 수정 (DRAFT만 가능)' })
  async update(@Param('id') id: string, @Body() dto: UpdateStandardDto) {
    return this.service.update(id, dto);
  }

  @Post(':id/activate')
  @ApiOperation({ summary: 'DRAFT → ACTIVE 전환 (기존 ACTIVE → SUPERSEDED)' })
  async activate(
    @Param('id') id: string,
    @Query('approvedBy') approvedBy?: string,
  ) {
    return this.service.activate(id, approvedBy);
  }

  @Post(':id/new-version')
  @ApiOperation({ summary: '새 버전 생성 (현재 기준서 복사 → DRAFT)' })
  async createNewVersion(
    @Param('id') id: string,
    @Query('createdBy') createdBy?: string,
  ) {
    return this.service.createNewVersion(id, createdBy);
  }

  @Post(':id/items')
  @ApiOperation({ summary: '검사 항목 추가' })
  async addItem(@Param('id') id: string, @Body() dto: CreateStandardItemDto) {
    return this.service.addItem(id, dto);
  }

  @Put(':id/items/:itemId')
  @ApiOperation({ summary: '검사 항목 수정' })
  async updateItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateStandardItemDto,
  ) {
    return this.service.updateItem(id, itemId, dto);
  }

  @Delete(':id/items/:itemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '검사 항목 삭제 (소프트)' })
  async deleteItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Query('deletedBy') deletedBy?: string,
  ): Promise<void> {
    return this.service.deleteItem(id, itemId, deletedBy);
  }
}
```

- [ ] **Step 2: 모듈 파일 생성**

`apps/backend/src/modules/inspection-standard/inspection-standard.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { InspectionStandardService } from './inspection-standard.service';
import { InspectionStandardController } from './inspection-standard.controller';

@Module({
  controllers: [InspectionStandardController],
  providers: [InspectionStandardService],
  exports: [InspectionStandardService],
})
export class InspectionStandardModule {}
```

- [ ] **Step 3: 모듈 index.ts 생성**

`apps/backend/src/modules/inspection-standard/index.ts`:

```typescript
export { InspectionStandardModule } from './inspection-standard.module';
export { InspectionStandardService } from './inspection-standard.service';
export { InspectionStandardController } from './inspection-standard.controller';
export * from './entities';
export * from './dto';
```

- [ ] **Step 4: app.module.ts에 모듈 등록**

`apps/backend/src/app.module.ts` 파일에서 기존 import 목록에 추가:

```typescript
// 기존 import 들 아래에 추가
import { InspectionStandardModule } from './modules/inspection-standard';
```

그리고 `imports` 배열에 추가:

```typescript
imports: [
  // ... 기존 모듈들
  InspectionStandardModule,
],
```

- [ ] **Step 5: 백엔드 빌드 확인**

```bash
cd apps/backend
pnpm build
```

Expected: `Successfully compiled` (에러 없음)

- [ ] **Step 6: API 스모크 테스트**

백엔드 서버를 실행한 뒤 (별도 터미널: `pnpm dev`):

```bash
# 기준서 등록
curl -s -X POST http://localhost:3005/api/v1/inspection-standards \
  -H "Content-Type: application/json" \
  -d '{"supplierCode":"SUP-001","supplierName":"테스트공급사","itemCode":"ITEM-001","itemName":"볼트M6"}' | jq .

# 목록 조회
curl -s http://localhost:3005/api/v1/inspection-standards | jq .

# 활성 기준서 조회 (아직 DRAFT이므로 null 반환)
curl -s "http://localhost:3005/api/v1/inspection-standards/active?supplierCode=SUP-001&itemCode=ITEM-001&inspectionType=IQC" | jq .
```

Expected: 첫 번째 curl → 기준서 JSON 반환, 세 번째 curl → `null`

- [ ] **Step 7: 커밋**

```bash
cd ../..
git add apps/backend/src/modules/inspection-standard/ apps/backend/src/app.module.ts
git commit -m "feat: add InspectionStandardModule controller and wire to AppModule"
```

---

## Task 5: 프론트엔드 타입 + Zustand 스토어

**Files:**
- Create: `apps/frontend/src/types/inspection-standard.ts`
- Modify: `apps/frontend/src/types/index.ts`
- Create: `apps/frontend/src/stores/inspection-standard-store.ts`
- Modify: `apps/frontend/src/stores/index.ts`

- [ ] **Step 1: 프론트엔드 타입 파일 생성**

`apps/frontend/src/types/inspection-standard.ts`:

```typescript
export enum InspectionStandardStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  SUPERSEDED = 'SUPERSEDED',
  INACTIVE = 'INACTIVE',
}

export enum InputType {
  NONE = 'NONE',
  NUMERIC = 'NUMERIC',
  ATTACHMENT = 'ATTACHMENT',
  TEXT = 'TEXT',
}

export const INPUT_TYPE_LABELS: Record<InputType, string> = {
  [InputType.NONE]: '미입력',
  [InputType.NUMERIC]: '수치값',
  [InputType.ATTACHMENT]: '첨부파일',
  [InputType.TEXT]: '텍스트입력',
};

export const STANDARD_STATUS_LABELS: Record<InspectionStandardStatus, string> = {
  [InspectionStandardStatus.DRAFT]: '초안',
  [InspectionStandardStatus.ACTIVE]: '활성',
  [InspectionStandardStatus.SUPERSEDED]: '구버전',
  [InspectionStandardStatus.INACTIVE]: '비활성',
};

export interface InspectionStandardItem {
  standardItemId: string;
  standardId: string;
  sequenceNo: number;
  characteristicName: string;
  characteristicNo?: string;
  applicableTypes?: string[] | null;
  inputType: InputType;
  specMin?: number;
  specMax?: number;
  specText?: string;
  unit?: string;
  isCritical: boolean;
  inspectionMethod?: string;
  inspectionEquipment?: string;
  samplingLevel?: string;
  aqlLevel?: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InspectionStandard {
  standardId: string;
  standardNo: string;
  supplierCode: string;
  supplierName?: string;
  itemCode: string;
  itemName?: string;
  version: number;
  status: InspectionStandardStatus;
  effectiveDate?: string;
  expiryDate?: string;
  approvedBy?: string;
  approvedDate?: string;
  remarks?: string;
  itemCount?: number;
  items?: InspectionStandardItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateInspectionStandardRequest {
  supplierCode: string;
  supplierName?: string;
  itemCode: string;
  itemName?: string;
  effectiveDate?: string;
  expiryDate?: string;
  remarks?: string;
  createdBy?: string;
}

export interface CreateInspectionStandardItemRequest {
  sequenceNo?: number;
  characteristicName: string;
  characteristicNo?: string;
  applicableTypes?: string[] | null;
  inputType: InputType;
  specMin?: number;
  specMax?: number;
  specText?: string;
  unit?: string;
  isCritical?: boolean;
  inspectionMethod?: string;
  inspectionEquipment?: string;
  samplingLevel?: string;
  aqlLevel?: string;
  remarks?: string;
  createdBy?: string;
}

export interface UpdateInspectionStandardItemRequest extends Partial<CreateInspectionStandardItemRequest> {
  updatedBy?: string;
}

export interface InspectionStandardQueryParams {
  supplierCode?: string;
  itemCode?: string;
  status?: InspectionStandardStatus;
  page?: number;
  limit?: number;
}

export interface PaginatedInspectionStandards {
  items: InspectionStandard[];
  total: number;
  page: number;
  limit: number;
}
```

- [ ] **Step 2: types/index.ts에 export 추가**

`apps/frontend/src/types/index.ts` 파일 맨 끝에 추가:

```typescript
export * from './inspection-standard';
```

- [ ] **Step 3: Zustand 스토어 생성**

`apps/frontend/src/stores/inspection-standard-store.ts`:

```typescript
import { create } from 'zustand';
import {
  InspectionStandard,
  InspectionStandardItem,
  InspectionStandardQueryParams,
  CreateInspectionStandardRequest,
  CreateInspectionStandardItemRequest,
  UpdateInspectionStandardItemRequest,
  PaginatedInspectionStandards,
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005/api/v1';

interface InspectionStandardState {
  standards: InspectionStandard[];
  selectedStandard: InspectionStandard | null;
  total: number;
  page: number;
  limit: number;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;

  fetchStandards: (params?: InspectionStandardQueryParams) => Promise<void>;
  fetchStandard: (standardId: string) => Promise<void>;
  createStandard: (data: CreateInspectionStandardRequest) => Promise<InspectionStandard | null>;
  updateStandard: (standardId: string, data: Partial<CreateInspectionStandardRequest>) => Promise<boolean>;
  activateStandard: (standardId: string, approvedBy?: string) => Promise<boolean>;
  createNewVersion: (standardId: string, createdBy?: string) => Promise<InspectionStandard | null>;
  addItem: (standardId: string, data: CreateInspectionStandardItemRequest) => Promise<InspectionStandardItem | null>;
  updateItem: (standardId: string, itemId: string, data: UpdateInspectionStandardItemRequest) => Promise<boolean>;
  deleteItem: (standardId: string, itemId: string) => Promise<boolean>;
  fetchActiveStandard: (supplierCode: string, itemCode: string, inspectionType?: string) => Promise<InspectionStandard | null>;
  setSelectedStandard: (standard: InspectionStandard | null) => void;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  clearError: () => void;
}

export const useInspectionStandardStore = create<InspectionStandardState>()(
  (set, get) => ({
    standards: [],
    selectedStandard: null,
    total: 0,
    page: 1,
    limit: 20,
    isLoading: false,
    isSubmitting: false,
    error: null,

    fetchStandards: async (params = {}) => {
      set({ isLoading: true, error: null });
      try {
        const { page, limit } = get();
        const queryParams = new URLSearchParams({
          page: String(params.page ?? page),
          limit: String(params.limit ?? limit),
          ...Object.entries(params).reduce((acc, [k, v]) => {
            if (v !== undefined && v !== null) acc[k] = String(v);
            return acc;
          }, {} as Record<string, string>),
        });
        const res = await fetch(`${API_BASE_URL}/inspection-standards?${queryParams}`);
        if (!res.ok) throw new Error('Failed to fetch standards');
        const data: PaginatedInspectionStandards = await res.json();
        set({ standards: data.items, total: data.total, page: data.page, limit: data.limit, isLoading: false });
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Unknown error', isLoading: false });
      }
    },

    fetchStandard: async (standardId) => {
      set({ isLoading: true, error: null });
      try {
        const res = await fetch(`${API_BASE_URL}/inspection-standards/${standardId}`);
        if (!res.ok) throw new Error('Failed to fetch standard');
        const standard: InspectionStandard = await res.json();
        set({ selectedStandard: standard, isLoading: false });
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Unknown error', isLoading: false });
      }
    },

    createStandard: async (data) => {
      set({ isSubmitting: true, error: null });
      try {
        const res = await fetch(`${API_BASE_URL}/inspection-standards`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || 'Failed to create standard');
        }
        const standard: InspectionStandard = await res.json();
        set((s) => ({ standards: [standard, ...s.standards], total: s.total + 1, isSubmitting: false }));
        return standard;
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Unknown error', isSubmitting: false });
        return null;
      }
    },

    updateStandard: async (standardId, data) => {
      set({ isSubmitting: true, error: null });
      try {
        const res = await fetch(`${API_BASE_URL}/inspection-standards/${standardId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to update standard');
        const updated: InspectionStandard = await res.json();
        set((s) => ({
          standards: s.standards.map((st) => (st.standardId === standardId ? { ...st, ...updated } : st)),
          selectedStandard: s.selectedStandard?.standardId === standardId ? { ...s.selectedStandard, ...updated } : s.selectedStandard,
          isSubmitting: false,
        }));
        return true;
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Unknown error', isSubmitting: false });
        return false;
      }
    },

    activateStandard: async (standardId, approvedBy) => {
      set({ isSubmitting: true, error: null });
      try {
        const query = approvedBy ? `?approvedBy=${encodeURIComponent(approvedBy)}` : '';
        const res = await fetch(`${API_BASE_URL}/inspection-standards/${standardId}/activate${query}`, {
          method: 'POST',
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || 'Failed to activate standard');
        }
        const updated: InspectionStandard = await res.json();
        set((s) => ({
          standards: s.standards.map((st) =>
            st.standardId === standardId
              ? { ...st, ...updated }
              : st.supplierCode === updated.supplierCode && st.itemCode === updated.itemCode && st.status === 'ACTIVE'
              ? { ...st, status: 'SUPERSEDED' as any }
              : st
          ),
          selectedStandard: s.selectedStandard?.standardId === standardId ? { ...s.selectedStandard, ...updated } : s.selectedStandard,
          isSubmitting: false,
        }));
        return true;
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Unknown error', isSubmitting: false });
        return false;
      }
    },

    createNewVersion: async (standardId, createdBy) => {
      set({ isSubmitting: true, error: null });
      try {
        const query = createdBy ? `?createdBy=${encodeURIComponent(createdBy)}` : '';
        const res = await fetch(`${API_BASE_URL}/inspection-standards/${standardId}/new-version${query}`, {
          method: 'POST',
        });
        if (!res.ok) throw new Error('Failed to create new version');
        const newStandard: InspectionStandard = await res.json();
        set((s) => ({ standards: [newStandard, ...s.standards], total: s.total + 1, isSubmitting: false }));
        return newStandard;
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Unknown error', isSubmitting: false });
        return null;
      }
    },

    addItem: async (standardId, data) => {
      set({ isSubmitting: true, error: null });
      try {
        const res = await fetch(`${API_BASE_URL}/inspection-standards/${standardId}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to add item');
        const item: InspectionStandardItem = await res.json();
        set((s) => ({
          selectedStandard: s.selectedStandard?.standardId === standardId
            ? { ...s.selectedStandard, items: [...(s.selectedStandard.items ?? []), item] }
            : s.selectedStandard,
          isSubmitting: false,
        }));
        return item;
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Unknown error', isSubmitting: false });
        return null;
      }
    },

    updateItem: async (standardId, itemId, data) => {
      set({ isSubmitting: true, error: null });
      try {
        const res = await fetch(`${API_BASE_URL}/inspection-standards/${standardId}/items/${itemId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to update item');
        const updated: InspectionStandardItem = await res.json();
        set((s) => ({
          selectedStandard: s.selectedStandard?.standardId === standardId
            ? {
                ...s.selectedStandard,
                items: (s.selectedStandard.items ?? []).map((it) =>
                  it.standardItemId === itemId ? updated : it
                ),
              }
            : s.selectedStandard,
          isSubmitting: false,
        }));
        return true;
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Unknown error', isSubmitting: false });
        return false;
      }
    },

    deleteItem: async (standardId, itemId) => {
      set({ isSubmitting: true, error: null });
      try {
        const res = await fetch(`${API_BASE_URL}/inspection-standards/${standardId}/items/${itemId}`, {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to delete item');
        set((s) => ({
          selectedStandard: s.selectedStandard?.standardId === standardId
            ? {
                ...s.selectedStandard,
                items: (s.selectedStandard.items ?? []).filter((it) => it.standardItemId !== itemId),
              }
            : s.selectedStandard,
          isSubmitting: false,
        }));
        return true;
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Unknown error', isSubmitting: false });
        return false;
      }
    },

    fetchActiveStandard: async (supplierCode, itemCode, inspectionType) => {
      try {
        const params = new URLSearchParams({ supplierCode, itemCode });
        if (inspectionType) params.set('inspectionType', inspectionType);
        const res = await fetch(`${API_BASE_URL}/inspection-standards/active?${params}`);
        if (!res.ok) return null;
        return await res.json();
      } catch {
        return null;
      }
    },

    setSelectedStandard: (standard) => set({ selectedStandard: standard }),
    setPage: (page) => set({ page }),
    setLimit: (limit) => set({ limit, page: 1 }),
    clearError: () => set({ error: null }),
  })
);
```

- [ ] **Step 4: stores/index.ts에 export 추가**

`apps/frontend/src/stores/index.ts` 파일 맨 끝에 추가:

```typescript
export * from './inspection-standard-store';
```

- [ ] **Step 5: 타입 체크**

```bash
cd apps/frontend
pnpm type-check
```

Expected: 에러 없음

- [ ] **Step 6: 커밋**

```bash
cd ../..
git add apps/frontend/src/types/inspection-standard.ts apps/frontend/src/types/index.ts \
        apps/frontend/src/stores/inspection-standard-store.ts apps/frontend/src/stores/index.ts
git commit -m "feat: add inspection-standard frontend types and Zustand store"
```

---

## Task 6: 프론트엔드 컴포넌트

**Files:**
- Create: `apps/frontend/src/components/inspection-standard/inspection-standard-table.tsx`
- Create: `apps/frontend/src/components/inspection-standard/inspection-standard-form.tsx`
- Create: `apps/frontend/src/components/inspection-standard/inspection-standard-item-form.tsx`
- Create: `apps/frontend/src/components/inspection-standard/inspection-standard-detail.tsx`
- Create: `apps/frontend/src/components/inspection-standard/inspection-standard-page-content.tsx`
- Create: `apps/frontend/src/components/inspection-standard/index.ts`

- [ ] **Step 1: 목록 테이블 컴포넌트 생성**

`apps/frontend/src/components/inspection-standard/inspection-standard-table.tsx`:

```tsx
'use client';

import { InspectionStandard, InspectionStandardStatus, STANDARD_STATUS_LABELS } from '@/types';

interface InspectionStandardTableProps {
  data: InspectionStandard[];
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onRowClick: (standard: InspectionStandard) => void;
  isLoading: boolean;
}

const statusColors: Record<InspectionStandardStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  ACTIVE: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  SUPERSEDED: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  INACTIVE: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
};

export function InspectionStandardTable({
  data,
  total,
  page,
  limit,
  onPageChange,
  onRowClick,
  isLoading,
}: InspectionStandardTableProps) {
  const totalPages = Math.ceil(total / limit);

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-gray-500">
        로딩 중...
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-gray-500">
        등록된 검사기준서가 없습니다.
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-gray-50 dark:bg-gray-800 text-left">
              <th className="px-3 py-2 font-medium text-gray-600 dark:text-gray-400">기준서번호</th>
              <th className="px-3 py-2 font-medium text-gray-600 dark:text-gray-400">공급업체</th>
              <th className="px-3 py-2 font-medium text-gray-600 dark:text-gray-400">품목코드</th>
              <th className="px-3 py-2 font-medium text-gray-600 dark:text-gray-400">품목명</th>
              <th className="px-3 py-2 font-medium text-gray-600 dark:text-gray-400 text-center">버전</th>
              <th className="px-3 py-2 font-medium text-gray-600 dark:text-gray-400 text-center">상태</th>
              <th className="px-3 py-2 font-medium text-gray-600 dark:text-gray-400">적용일</th>
              <th className="px-3 py-2 font-medium text-gray-600 dark:text-gray-400">승인자</th>
              <th className="px-3 py-2 font-medium text-gray-600 dark:text-gray-400 text-center">항목수</th>
            </tr>
          </thead>
          <tbody>
            {data.map((std) => (
              <tr
                key={std.standardId}
                onClick={() => onRowClick(std)}
                className="border-b border-border cursor-pointer hover:bg-surface dark:hover:bg-surface-dark transition-colors"
              >
                <td className="px-3 py-2 font-mono text-xs text-primary">{std.standardNo}</td>
                <td className="px-3 py-2">{std.supplierCode}<br /><span className="text-xs text-gray-500">{std.supplierName}</span></td>
                <td className="px-3 py-2 font-mono text-xs">{std.itemCode}</td>
                <td className="px-3 py-2">{std.itemName ?? '-'}</td>
                <td className="px-3 py-2 text-center font-medium">v{std.version}</td>
                <td className="px-3 py-2 text-center">
                  <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${statusColors[std.status]}`}>
                    {STANDARD_STATUS_LABELS[std.status]}
                  </span>
                </td>
                <td className="px-3 py-2 text-xs">{std.effectiveDate ? std.effectiveDate.slice(0, 10) : '-'}</td>
                <td className="px-3 py-2 text-xs">{std.approvedBy ?? '-'}</td>
                <td className="px-3 py-2 text-center">{std.itemCount ?? 0}개</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border px-3 py-2 mt-2">
          <span className="text-xs text-gray-500">총 {total}건</span>
          <div className="flex gap-1">
            <button
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="rounded px-2 py-1 text-xs border border-border disabled:opacity-40 hover:bg-surface"
            >
              이전
            </button>
            <span className="px-2 py-1 text-xs">{page} / {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="rounded px-2 py-1 text-xs border border-border disabled:opacity-40 hover:bg-surface"
            >
              다음
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 기준서 헤더 등록/수정 폼 생성**

`apps/frontend/src/components/inspection-standard/inspection-standard-form.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { CreateInspectionStandardRequest } from '@/types';
import { Button } from '@/components/ui/button';

interface InspectionStandardFormProps {
  onSubmit: (data: CreateInspectionStandardRequest) => void;
  onCancel: () => void;
  initialData?: Partial<CreateInspectionStandardRequest>;
}

export function InspectionStandardForm({ onSubmit, onCancel, initialData }: InspectionStandardFormProps) {
  const [form, setForm] = useState({
    supplierCode: initialData?.supplierCode ?? '',
    supplierName: initialData?.supplierName ?? '',
    itemCode: initialData?.itemCode ?? '',
    itemName: initialData?.itemName ?? '',
    effectiveDate: initialData?.effectiveDate ?? '',
    expiryDate: initialData?.expiryDate ?? '',
    remarks: initialData?.remarks ?? '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.supplierCode.trim()) e.supplierCode = '공급업체 코드를 입력하세요';
    if (!form.itemCode.trim()) e.itemCode = '품목 코드를 입력하세요';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      supplierCode: form.supplierCode,
      supplierName: form.supplierName || undefined,
      itemCode: form.itemCode,
      itemName: form.itemName || undefined,
      effectiveDate: form.effectiveDate || undefined,
      expiryDate: form.expiryDate || undefined,
      remarks: form.remarks || undefined,
    });
  };

  const field = (label: string, key: keyof typeof form, type = 'text', required = false) => (
    <div className="space-y-1">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={form[key]}
        onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
        className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
      />
      {errors[key] && <p className="text-xs text-red-500">{errors[key]}</p>}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {field('공급업체 코드', 'supplierCode', 'text', true)}
        {field('공급업체명', 'supplierName')}
        {field('품목 코드', 'itemCode', 'text', true)}
        {field('품목명', 'itemName')}
        {field('적용 시작일', 'effectiveDate', 'date')}
        {field('만료일', 'expiryDate', 'date')}
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">비고</label>
        <textarea
          value={form.remarks}
          onChange={(e) => setForm((p) => ({ ...p, remarks: e.target.value }))}
          rows={2}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>취소</Button>
        <Button type="submit">저장</Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 3: 검사항목 폼 생성**

`apps/frontend/src/components/inspection-standard/inspection-standard-item-form.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { CreateInspectionStandardItemRequest, InputType, INPUT_TYPE_LABELS } from '@/types';
import { Button } from '@/components/ui/button';

const INSPECTION_TYPES = ['IQC', 'IPQC', 'FQC', 'OQC'];

interface InspectionStandardItemFormProps {
  onSubmit: (data: CreateInspectionStandardItemRequest) => void;
  onCancel: () => void;
  initialData?: Partial<CreateInspectionStandardItemRequest>;
}

export function InspectionStandardItemForm({ onSubmit, onCancel, initialData }: InspectionStandardItemFormProps) {
  const [form, setForm] = useState({
    characteristicName: initialData?.characteristicName ?? '',
    characteristicNo: initialData?.characteristicNo ?? '',
    inputType: initialData?.inputType ?? InputType.NONE,
    applicableTypes: initialData?.applicableTypes ?? null as string[] | null,
    specMin: initialData?.specMin !== undefined ? String(initialData.specMin) : '',
    specMax: initialData?.specMax !== undefined ? String(initialData.specMax) : '',
    specText: initialData?.specText ?? '',
    unit: initialData?.unit ?? '',
    isCritical: initialData?.isCritical ?? false,
    inspectionMethod: initialData?.inspectionMethod ?? '',
    inspectionEquipment: initialData?.inspectionEquipment ?? '',
    samplingLevel: initialData?.samplingLevel ?? '',
    aqlLevel: initialData?.aqlLevel ?? '',
    remarks: initialData?.remarks ?? '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.characteristicName.trim()) e.characteristicName = '특성명을 입력하세요';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const toggleApplicableType = (type: string) => {
    setForm((p) => {
      const current = p.applicableTypes ?? [];
      const next = current.includes(type)
        ? current.filter((t) => t !== type)
        : [...current, type];
      return { ...p, applicableTypes: next.length === 0 ? null : next };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      characteristicName: form.characteristicName,
      characteristicNo: form.characteristicNo || undefined,
      inputType: form.inputType,
      applicableTypes: form.applicableTypes,
      specMin: form.specMin ? parseFloat(form.specMin) : undefined,
      specMax: form.specMax ? parseFloat(form.specMax) : undefined,
      specText: form.specText || undefined,
      unit: form.unit || undefined,
      isCritical: form.isCritical,
      inspectionMethod: form.inspectionMethod || undefined,
      inspectionEquipment: form.inspectionEquipment || undefined,
      samplingLevel: form.samplingLevel || undefined,
      aqlLevel: form.aqlLevel || undefined,
      remarks: form.remarks || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            특성명 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.characteristicName}
            onChange={(e) => setForm((p) => ({ ...p, characteristicName: e.target.value }))}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            placeholder="외경치수"
          />
          {errors.characteristicName && <p className="text-xs text-red-500">{errors.characteristicName}</p>}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">특성번호</label>
          <input
            type="text"
            value={form.characteristicNo}
            onChange={(e) => setForm((p) => ({ ...p, characteristicNo: e.target.value }))}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            placeholder="D-01"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">입력구분</label>
          <select
            value={form.inputType}
            onChange={(e) => setForm((p) => ({ ...p, inputType: e.target.value as InputType }))}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
          >
            {Object.entries(INPUT_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">단위</label>
          <input
            type="text"
            value={form.unit}
            onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            placeholder="mm"
          />
        </div>

        {form.inputType === InputType.NUMERIC && (
          <>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">규격 하한</label>
              <input
                type="number"
                step="any"
                value={form.specMin}
                onChange={(e) => setForm((p) => ({ ...p, specMin: e.target.value }))}
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
                placeholder="5.9"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">규격 상한</label>
              <input
                type="number"
                step="any"
                value={form.specMax}
                onChange={(e) => setForm((p) => ({ ...p, specMax: e.target.value }))}
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
                placeholder="6.1"
              />
            </div>
          </>
        )}

        {(form.inputType === InputType.TEXT || form.inputType === InputType.NONE) && (
          <div className="col-span-2 space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">규격 텍스트</label>
            <input
              type="text"
              value={form.specText}
              onChange={(e) => setForm((p) => ({ ...p, specText: e.target.value }))}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
              placeholder="스크래치 없을 것"
            />
          </div>
        )}

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">검사 방법</label>
          <input
            type="text"
            value={form.inspectionMethod}
            onChange={(e) => setForm((p) => ({ ...p, inspectionMethod: e.target.value }))}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
            placeholder="마이크로미터"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">검사 장비</label>
          <input
            type="text"
            value={form.inspectionEquipment}
            onChange={(e) => setForm((p) => ({ ...p, inspectionEquipment: e.target.value }))}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
            placeholder="버니어캘리퍼스"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">샘플링 수준</label>
          <input
            type="text"
            value={form.samplingLevel}
            onChange={(e) => setForm((p) => ({ ...p, samplingLevel: e.target.value }))}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
            placeholder="II"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">AQL</label>
          <input
            type="text"
            value={form.aqlLevel}
            onChange={(e) => setForm((p) => ({ ...p, aqlLevel: e.target.value }))}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
            placeholder="1.0"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          적용 검사 유형 <span className="text-xs text-gray-500">(미선택 시 전체 적용)</span>
        </label>
        <div className="flex gap-2">
          {INSPECTION_TYPES.map((type) => {
            const checked = form.applicableTypes?.includes(type) ?? false;
            return (
              <button
                key={type}
                type="button"
                onClick={() => toggleApplicableType(type)}
                className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                  checked
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'border-border text-gray-600 hover:bg-surface dark:text-gray-400'
                }`}
              >
                {type}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isCritical"
          checked={form.isCritical}
          onChange={(e) => setForm((p) => ({ ...p, isCritical: e.target.checked }))}
          className="h-4 w-4 rounded border-border"
        />
        <label htmlFor="isCritical" className="text-sm text-gray-700 dark:text-gray-300">
          중요 특성 (★)
        </label>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">비고</label>
        <input
          type="text"
          value={form.remarks}
          onChange={(e) => setForm((p) => ({ ...p, remarks: e.target.value }))}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>취소</Button>
        <Button type="submit">저장</Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 4: 상세 패널 컴포넌트 생성**

`apps/frontend/src/components/inspection-standard/inspection-standard-detail.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { X, Plus, Edit2, Trash2, Star } from 'lucide-react';
import {
  InspectionStandard,
  InspectionStandardStatus,
  InspectionStandardItem,
  CreateInspectionStandardItemRequest,
  INPUT_TYPE_LABELS,
  STANDARD_STATUS_LABELS,
} from '@/types';
import { useInspectionStandardStore } from '@/stores';
import { Button } from '@/components/ui/button';
import { InspectionStandardItemForm } from './inspection-standard-item-form';

interface InspectionStandardDetailProps {
  standard: InspectionStandard;
  onClose: () => void;
  onRefresh: () => void;
}

export function InspectionStandardDetail({ standard, onClose, onRefresh }: InspectionStandardDetailProps) {
  const { activateStandard, createNewVersion, addItem, updateItem, deleteItem, isSubmitting } =
    useInspectionStandardStore();

  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState<InspectionStandardItem | null>(null);

  const handleActivate = async () => {
    const approvedBy = prompt('승인자 이름을 입력하세요:');
    if (approvedBy === null) return;
    const ok = await activateStandard(standard.standardId, approvedBy || undefined);
    if (ok) onRefresh();
  };

  const handleNewVersion = async () => {
    const newStd = await createNewVersion(standard.standardId);
    if (newStd) onRefresh();
  };

  const handleAddItem = async (data: CreateInspectionStandardItemRequest) => {
    await addItem(standard.standardId, data);
    setShowItemForm(false);
    onRefresh();
  };

  const handleUpdateItem = async (data: CreateInspectionStandardItemRequest) => {
    if (!editingItem) return;
    await updateItem(standard.standardId, editingItem.standardItemId, data);
    setEditingItem(null);
    onRefresh();
  };

  const handleDeleteItem = async (item: InspectionStandardItem) => {
    if (!confirm(`'${item.characteristicName}' 항목을 삭제하시겠습니까?`)) return;
    await deleteItem(standard.standardId, item.standardItemId);
    onRefresh();
  };

  const isDraft = standard.status === InspectionStandardStatus.DRAFT;

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-[680px] bg-background-white dark:bg-background-dark shadow-2xl border-l border-border flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h2 className="font-semibold text-gray-900 dark:text-white">
            {standard.standardNo} <span className="text-sm font-normal text-gray-500">v{standard.version}</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {standard.supplierCode} ({standard.supplierName}) / {standard.itemCode} ({standard.itemName})
          </p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 border-b border-border px-5 py-3">
        <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${
          standard.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
          standard.status === 'DRAFT' ? 'bg-gray-100 text-gray-700' :
          standard.status === 'SUPERSEDED' ? 'bg-yellow-100 text-yellow-700' :
          'bg-red-100 text-red-700'
        }`}>
          {STANDARD_STATUS_LABELS[standard.status]}
        </span>
        {isDraft && (
          <Button size="sm" onClick={handleActivate} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
            승인 (ACTIVE)
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={handleNewVersion} disabled={isSubmitting}>
          새 버전
        </Button>
      </div>

      {/* Standard info */}
      <div className="grid grid-cols-3 gap-3 px-5 py-3 bg-gray-50 dark:bg-gray-800 text-sm border-b border-border">
        <div><span className="text-xs text-gray-500">적용일</span><p>{standard.effectiveDate?.slice(0, 10) ?? '-'}</p></div>
        <div><span className="text-xs text-gray-500">만료일</span><p>{standard.expiryDate?.slice(0, 10) ?? '-'}</p></div>
        <div><span className="text-xs text-gray-500">승인자</span><p>{standard.approvedBy ?? '-'}</p></div>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            검사항목 ({standard.items?.length ?? 0}개)
          </h3>
          {isDraft && (
            <Button size="sm" onClick={() => setShowItemForm(true)} className="gap-1">
              <Plus className="h-3 w-3" /> 항목추가
            </Button>
          )}
        </div>

        {showItemForm && (
          <div className="px-5 py-4 border-b border-border bg-blue-50 dark:bg-blue-950">
            <h4 className="text-sm font-medium mb-3">새 항목 추가</h4>
            <InspectionStandardItemForm onSubmit={handleAddItem} onCancel={() => setShowItemForm(false)} />
          </div>
        )}

        {editingItem && (
          <div className="px-5 py-4 border-b border-border bg-yellow-50 dark:bg-yellow-950">
            <h4 className="text-sm font-medium mb-3">항목 수정: {editingItem.characteristicName}</h4>
            <InspectionStandardItemForm
              initialData={editingItem}
              onSubmit={handleUpdateItem}
              onCancel={() => setEditingItem(null)}
            />
          </div>
        )}

        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800 text-left border-b border-border">
              <th className="px-3 py-2 text-gray-500">No</th>
              <th className="px-3 py-2 text-gray-500">특성명</th>
              <th className="px-3 py-2 text-gray-500">입력구분</th>
              <th className="px-3 py-2 text-gray-500">규격</th>
              <th className="px-3 py-2 text-gray-500">적용유형</th>
              <th className="px-3 py-2 text-gray-500">검사방법</th>
              {isDraft && <th className="px-3 py-2"></th>}
            </tr>
          </thead>
          <tbody>
            {(standard.items ?? []).map((item) => (
              <tr key={item.standardItemId} className="border-b border-border hover:bg-surface dark:hover:bg-surface-dark">
                <td className="px-3 py-2 text-gray-500">{item.sequenceNo}</td>
                <td className="px-3 py-2 font-medium">
                  {item.isCritical && <Star className="inline h-3 w-3 text-yellow-500 mr-1 fill-current" />}
                  {item.characteristicName}
                  {item.characteristicNo && <span className="ml-1 text-gray-400">({item.characteristicNo})</span>}
                </td>
                <td className="px-3 py-2">{INPUT_TYPE_LABELS[item.inputType]}</td>
                <td className="px-3 py-2 text-gray-600">
                  {item.specMin !== undefined && item.specMax !== undefined
                    ? `${item.specMin} ~ ${item.specMax}${item.unit ? ` ${item.unit}` : ''}`
                    : item.specText ?? '-'}
                </td>
                <td className="px-3 py-2">
                  {item.applicableTypes ? item.applicableTypes.join(', ') : '전체'}
                </td>
                <td className="px-3 py-2 text-gray-500">{item.inspectionMethod ?? '-'}</td>
                {isDraft && (
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      <button onClick={() => setEditingItem(item)} className="text-gray-400 hover:text-primary">
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleDeleteItem(item)} className="text-gray-400 hover:text-red-500">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {(standard.items ?? []).length === 0 && (
              <tr>
                <td colSpan={isDraft ? 7 : 6} className="px-3 py-6 text-center text-gray-400">
                  등록된 검사항목이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: 페이지 컨텐츠 컴포넌트 생성**

`apps/frontend/src/components/inspection-standard/inspection-standard-page-content.tsx`:

```tsx
'use client';

import { useState, useEffect } from 'react';
import { Plus, Filter, X, BookOpen } from 'lucide-react';
import { InspectionStandardStatus, STANDARD_STATUS_LABELS } from '@/types';
import { useInspectionStandardStore } from '@/stores';
import { Button } from '@/components/ui/button';
import { InspectionStandardTable } from './inspection-standard-table';
import { InspectionStandardForm } from './inspection-standard-form';
import { InspectionStandardDetail } from './inspection-standard-detail';

export function InspectionStandardPageContent() {
  const {
    standards, total, page, limit, isLoading,
    fetchStandards, fetchStandard, createStandard, setPage, selectedStandard, setSelectedStandard,
  } = useInspectionStandardStore();

  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({ supplierCode: '', itemCode: '', status: '' });

  useEffect(() => {
    fetchStandards({ page, limit });
  }, [page, limit]);

  const applyFilters = () => {
    fetchStandards({
      supplierCode: filters.supplierCode || undefined,
      itemCode: filters.itemCode || undefined,
      status: (filters.status as InspectionStandardStatus) || undefined,
      page: 1,
      limit,
    });
  };

  const resetFilters = () => {
    setFilters({ supplierCode: '', itemCode: '', status: '' });
    fetchStandards({ page: 1, limit });
  };

  const handleRowClick = async (std: any) => {
    await fetchStandard(std.standardId);
  };

  const handleCreateStandard = async (data: any) => {
    const created = await createStandard(data);
    if (created) {
      setShowForm(false);
      fetchStandards({ page: 1, limit });
    }
  };

  const handleDetailClose = () => {
    setSelectedStandard(null);
  };

  const handleRefresh = () => {
    if (selectedStandard) fetchStandard(selectedStandard.standardId);
    fetchStandards({ page, limit });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            검사기준서 관리
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Inspection Standard Management — 공급업체+품목별 검사 기준 정의
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          새 기준서
        </Button>
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-border bg-surface p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">검색 필터</span>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="text-xs text-gray-600 dark:text-gray-400">공급업체 코드</label>
            <input
              type="text"
              value={filters.supplierCode}
              onChange={(e) => setFilters((p) => ({ ...p, supplierCode: e.target.value }))}
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm"
              placeholder="SUP-001"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600 dark:text-gray-400">품목 코드</label>
            <input
              type="text"
              value={filters.itemCode}
              onChange={(e) => setFilters((p) => ({ ...p, itemCode: e.target.value }))}
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm"
              placeholder="ITEM-001"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600 dark:text-gray-400">상태</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm"
            >
              <option value="">전체</option>
              {Object.entries(STANDARD_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <Button onClick={applyFilters} className="flex-1">검색</Button>
            <Button onClick={resetFilters} variant="outline"><X className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-surface p-4">
        <InspectionStandardTable
          data={standards}
          total={total}
          page={page}
          limit={limit}
          onPageChange={setPage}
          onRowClick={handleRowClick}
          isLoading={isLoading}
        />
      </div>

      {/* New Standard Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-2xl rounded-lg bg-white p-6 dark:bg-gray-900">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">새 검사기준서 등록</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <InspectionStandardForm onSubmit={handleCreateStandard} onCancel={() => setShowForm(false)} />
          </div>
        </div>
      )}

      {/* Detail Panel */}
      {selectedStandard && (
        <>
          <div className="fixed inset-0 z-30 bg-black/20" onClick={handleDetailClose} />
          <InspectionStandardDetail
            standard={selectedStandard}
            onClose={handleDetailClose}
            onRefresh={handleRefresh}
          />
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 6: 컴포넌트 index.ts 생성**

`apps/frontend/src/components/inspection-standard/index.ts`:

```typescript
export { InspectionStandardTable } from './inspection-standard-table';
export { InspectionStandardForm } from './inspection-standard-form';
export { InspectionStandardItemForm } from './inspection-standard-item-form';
export { InspectionStandardDetail } from './inspection-standard-detail';
export { InspectionStandardPageContent } from './inspection-standard-page-content';
```

- [ ] **Step 7: 타입 체크**

```bash
cd apps/frontend
pnpm type-check
```

Expected: 에러 없음

- [ ] **Step 8: 커밋**

```bash
cd ../..
git add apps/frontend/src/components/inspection-standard/
git commit -m "feat: add inspection-standard frontend components"
```

---

## Task 7: 페이지 추가 + 사이드바 업데이트

**Files:**
- Create: `apps/frontend/src/app/(dashboard)/inspection/standards/page.tsx`
- Modify: `apps/frontend/src/components/layout/sidebar.tsx`

- [ ] **Step 1: 페이지 파일 생성**

`apps/frontend/src/app/(dashboard)/inspection/standards/page.tsx`:

```tsx
'use client';

import { InspectionStandardPageContent } from '@/components/inspection-standard';

export default function InspectionStandardsPage() {
  return <InspectionStandardPageContent />;
}
```

- [ ] **Step 2: 사이드바에 메뉴 항목 추가**

`apps/frontend/src/components/layout/sidebar.tsx` 파일에서 `inspection` 그룹의 `children` 배열을 찾아 마지막 항목(`oqc`) 뒤에 추가:

```typescript
// 현재 코드 (oqc 항목):
{ id: 'oqc', label: '출하검사 (OQC)', labelEn: 'OQC', href: '/inspection/oqc', isMvp: true },

// 이 줄 아래에 추가:
{ id: 'standards', label: '검사기준서 관리', labelEn: 'Inspection Standard', href: '/inspection/standards', isMvp: true },
```

- [ ] **Step 3: 개발 서버로 UI 확인**

```bash
# 루트에서
pnpm dev
```

브라우저에서 확인:
1. `http://localhost:3000/inspection/standards` 접속
2. 사이드바 "검사관리" 하위에 "검사기준서 관리" 메뉴가 보이는지 확인
3. "새 기준서" 버튼 클릭 → 폼 모달 열리는지 확인
4. 공급업체코드 `SUP-001`, 품목코드 `ITEM-001` 입력 후 저장
5. 목록에 기준서가 나타나는지 확인
6. 행 클릭 → 우측 상세 패널이 열리는지 확인
7. "항목추가" 버튼 → 항목 폼이 열리는지 확인
8. "승인 (ACTIVE)" 버튼 → 상태가 활성으로 바뀌는지 확인

- [ ] **Step 4: 커밋**

```bash
git add apps/frontend/src/app/\(dashboard\)/inspection/standards/ \
        apps/frontend/src/components/layout/sidebar.tsx
git commit -m "feat: add inspection standards page and sidebar menu"
```

---

## Task 8: InspectionForm 기준서 자동 연계

**Files:**
- Modify: `apps/frontend/src/components/inspection/inspection-form.tsx`

- [ ] **Step 1: inspection-form.tsx에 기준서 불러오기 추가**

`apps/frontend/src/components/inspection/inspection-form.tsx` 파일 상단 import에 추가:

```typescript
import { useInspectionStandardStore } from '@/stores';
import { InputType } from '@/types';
```

폼 컴포넌트 함수 내부에 상태와 핸들러 추가 (기존 `const [isSubmitting, setIsSubmitting] = useState(false);` 아래):

```typescript
const { fetchActiveStandard } = useInspectionStandardStore();
const [standardLoading, setStandardLoading] = useState(false);
const [loadedStandardNo, setLoadedStandardNo] = useState<string | null>(null);

const handleLoadStandard = async () => {
  if (!formData.supplierCode || !formData.itemCode) return;
  setStandardLoading(true);
  try {
    const standard = await fetchActiveStandard(
      formData.supplierCode,
      formData.itemCode,
      inspectionType,
    );
    if (!standard || !standard.items || standard.items.length === 0) {
      alert('해당 공급업체+품목에 등록된 활성 기준서가 없습니다.');
      return;
    }
    setLoadedStandardNo(standard.standardNo);
    if (onStandardLoaded) {
      onStandardLoaded(standard.items);
    }
  } finally {
    setStandardLoading(false);
  }
};
```

`InspectionFormProps` 인터페이스에 선택적 콜백 추가:

```typescript
interface InspectionFormProps {
  inspectionType: InspectionType;
  onSubmit: (data: CreateInspectionLotRequest) => void;
  onCancel: () => void;
  initialData?: Partial<CreateInspectionLotRequest>;
  onStandardLoaded?: (items: any[]) => void;  // 기준서 항목 전달용 콜백
}
```

폼 내부 "공급업체 코드" 필드 아래 (Supplier Code 입력 div 끝)에 "기준서 불러오기" 버튼 섹션 추가:

```tsx
{/* 기준서 불러오기 */}
{(formData.supplierCode && formData.itemCode) && (
  <div className="col-span-2">
    <div className="flex items-center gap-3 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 dark:border-blue-800 dark:bg-blue-950">
      <span className="text-xs text-blue-700 dark:text-blue-300">
        {loadedStandardNo
          ? `✓ 기준서 적용됨: ${loadedStandardNo}`
          : '공급업체 + 품목코드가 입력되었습니다. 검사기준서를 불러올 수 있습니다.'}
      </span>
      <button
        type="button"
        onClick={handleLoadStandard}
        disabled={standardLoading}
        className="ml-auto shrink-0 rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {standardLoading ? '조회 중...' : '기준서 불러오기'}
      </button>
    </div>
  </div>
)}
```

위 섹션의 렌더링 위치: `grid` div 안의 마지막 항목(작업지시번호 div) 다음, `grid` div 닫는 태그 바로 앞.

- [ ] **Step 2: InspectionPageContent에서 콜백 연결**

`apps/frontend/src/components/inspection/inspection-page-content.tsx` 파일에서 `InspectionForm` 사용 부분에 `onStandardLoaded` 콜백 추가:

```tsx
// 기존:
<InspectionForm
  inspectionType={inspectionType}
  onSubmit={handleCreateLot}
  onCancel={() => setShowForm(false)}
/>

// 변경:
<InspectionForm
  inspectionType={inspectionType}
  onSubmit={handleCreateLot}
  onCancel={() => setShowForm(false)}
  onStandardLoaded={(items) => {
    // 기준서 항목을 결과 입력 기본값으로 세팅 (콘솔 확인용, 향후 InspectionResultInput 연계 시 확장)
    console.log('Loaded standard items:', items.map((it) => it.characteristicName));
  }}
/>
```

- [ ] **Step 3: 타입 체크**

```bash
cd apps/frontend
pnpm type-check
```

Expected: 에러 없음

- [ ] **Step 4: 통합 동작 확인**

1. IQC 페이지 → "새 검사" 버튼 클릭
2. 공급업체 코드 `SUP-001`, 품목코드 `ITEM-001` 입력
3. 파란 배너와 "기준서 불러오기" 버튼 표시 확인
4. 버튼 클릭 → ACTIVE 기준서가 있으면 `✓ 기준서 적용됨: IS-...` 표시 확인
5. 브라우저 콘솔에 `Loaded standard items: [...]` 출력 확인

- [ ] **Step 5: 최종 커밋**

```bash
cd ../..
git add apps/frontend/src/components/inspection/inspection-form.tsx \
        apps/frontend/src/components/inspection/inspection-page-content.tsx
git commit -m "feat: add 기준서 불러오기 to InspectionForm with active standard auto-load"
```

---

## 셀프 리뷰 체크리스트

- [x] DB 스키마 (헤더 + 항목, 복합 비즈니스 키 supplierCode+itemCode) → Task 1
- [x] inputType 4종 (NONE/NUMERIC/ATTACHMENT/TEXT) → Task 2, 6
- [x] API 9개 엔드포인트 → Task 3, 4
- [x] ACTIVE는 1개만 유지 (activate 시 기존 ACTIVE → SUPERSEDED) → Task 3 `activate()`
- [x] 새 버전 생성 (항목 포함 복사) → Task 3 `createNewVersion()`
- [x] applicableTypes 직렬화/역직렬화 → Task 3 `deserializeItem()`
- [x] `GET /active` 라우트가 `GET /:id` 앞에 위치 → Task 4 컨트롤러 주의사항
- [x] 프론트엔드 타입 + 스토어 → Task 5
- [x] UI 컴포넌트 4개 + 페이지 → Task 6, 7
- [x] 사이드바 메뉴 추가 → Task 7
- [x] IQC/IPQC/FQC/OQC 연계 (기준서 불러오기 버튼) → Task 8

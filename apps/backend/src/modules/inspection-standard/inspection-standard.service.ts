import {
  Injectable,
  NotFoundException,
  BadRequestException,
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

    const where: Record<string, unknown> = { deletedAt: null };
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      items: items.map((s: any) => ({ ...s, itemCount: s._count.items, _count: undefined })),
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

    return this.prisma.$transaction(async (tx: any) => {
      await tx.inspectionStandard.updateMany({
        where: {
          supplierCode: standard.supplierCode,
          itemCode: standard.itemCode,
          status: InspectionStandardStatus.ACTIVE,
          deletedAt: null,
        },
        data: { status: InspectionStandardStatus.SUPERSEDED },
      });

      return tx.inspectionStandard.update({
        where: { standardId },
        data: {
          status: InspectionStandardStatus.ACTIVE,
          approvedBy: approvedBy ?? null,
          approvedDate: new Date(),
        },
        include: { items: { where: { deletedAt: null }, orderBy: { sequenceNo: 'asc' } } },
      });
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      items: deserialized.items.filter(
        (item: any) =>
          !item.applicableTypes || (item.applicableTypes as string[]).includes(inspectionType),
      ),
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private deserializeItems(standard: any) {
    return {
      ...standard,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      items: (standard.items ?? []).map((item: any) => this.deserializeItem(item)),
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private deserializeItem(item: any) {
    return {
      ...item,
      applicableTypes: item.applicableTypes
        ? JSON.parse(item.applicableTypes) as string[]
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

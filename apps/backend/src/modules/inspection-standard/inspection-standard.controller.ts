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

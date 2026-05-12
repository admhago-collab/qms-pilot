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
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { InspectionStandardService } from './inspection-standard.service';
import {
  CreateStandardDto,
  UpdateStandardDto,
  StandardQueryDto,
  CreateStandardItemDto,
  UpdateStandardItemDto,
} from './dto';

/**
 * 검사기준서 관리 컨트롤러
 */
@ApiTags('InspectionStandard')
@Controller('inspection-standards')
export class InspectionStandardController {
  constructor(private readonly service: InspectionStandardService) {}

  /**
   * ACTIVE 기준서 조회 (자동 불러오기용)
   * NOTE: Must be declared before @Get(':id') to avoid route shadowing
   */
  @Get('active')
  @ApiOperation({ summary: '공급업체+품목+검사유형으로 ACTIVE 기준서 조회 (자동 불러오기용)' })
  @ApiQuery({ name: 'supplierCode', required: true })
  @ApiQuery({ name: 'itemCode', required: true })
  @ApiQuery({ name: 'inspectionType', required: false })
  @ApiResponse({ status: 200, description: 'ACTIVE 기준서 반환 (없으면 null)' })
  async findActive(
    @Query('supplierCode') supplierCode: string,
    @Query('itemCode') itemCode: string,
    @Query('inspectionType') inspectionType?: string,
  ) {
    return this.service.findActive(supplierCode, itemCode, inspectionType);
  }

  /**
   * 검사기준서 목록 조회
   */
  @Get()
  @ApiOperation({ summary: '검사기준서 목록 조회' })
  @ApiResponse({ status: 200, description: '기준서 목록 + 페이지네이션' })
  async findAll(@Query() query: StandardQueryDto) {
    return this.service.findAll(query);
  }

  /**
   * 검사기준서 등록
   */
  @Post()
  @ApiOperation({ summary: '검사기준서 등록' })
  @ApiResponse({ status: 201, description: '기준서 생성 성공 (status=DRAFT)' })
  async create(@Body() dto: CreateStandardDto) {
    return this.service.create(dto);
  }

  /**
   * 검사기준서 상세 조회
   */
  @Get(':id')
  @ApiOperation({ summary: '검사기준서 상세 조회' })
  @ApiParam({ name: 'id', description: 'standardId' })
  @ApiResponse({ status: 200, description: '기준서 헤더 + 항목 목록' })
  @ApiResponse({ status: 404, description: '기준서 없음' })
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  /**
   * 검사기준서 수정 (DRAFT 상태만 가능)
   */
  @Put(':id')
  @ApiOperation({ summary: '검사기준서 수정 (DRAFT만 가능)' })
  @ApiParam({ name: 'id', description: 'standardId' })
  @ApiResponse({ status: 200, description: '수정 성공' })
  @ApiResponse({ status: 400, description: 'DRAFT 상태가 아님' })
  @ApiResponse({ status: 404, description: '기준서 없음' })
  async update(@Param('id') id: string, @Body() dto: UpdateStandardDto) {
    return this.service.update(id, dto);
  }

  /**
   * DRAFT → ACTIVE 전환
   */
  @Post(':id/activate')
  @ApiOperation({ summary: 'DRAFT → ACTIVE 전환 (기존 ACTIVE → SUPERSEDED)' })
  @ApiParam({ name: 'id', description: 'standardId' })
  @ApiResponse({ status: 201, description: '활성화 성공' })
  @ApiResponse({ status: 400, description: 'DRAFT 상태가 아님' })
  @ApiResponse({ status: 404, description: '기준서 없음' })
  async activate(
    @Param('id') id: string,
    @Query('approvedBy') approvedBy?: string,
  ) {
    return this.service.activate(id, approvedBy);
  }

  /**
   * 새 버전 생성
   */
  @Post(':id/new-version')
  @ApiOperation({ summary: '새 버전 생성 (현재 기준서 복사 → DRAFT)' })
  @ApiParam({ name: 'id', description: 'standardId' })
  @ApiResponse({ status: 201, description: '새 버전 DRAFT 생성 성공' })
  @ApiResponse({ status: 404, description: '기준서 없음' })
  async createNewVersion(
    @Param('id') id: string,
    @Query('createdBy') createdBy?: string,
  ) {
    return this.service.createNewVersion(id, createdBy);
  }

  /**
   * 검사 항목 추가
   */
  @Post(':id/items')
  @ApiOperation({ summary: '검사 항목 추가' })
  @ApiParam({ name: 'id', description: 'standardId' })
  @ApiResponse({ status: 201, description: '항목 추가 성공' })
  @ApiResponse({ status: 400, description: 'DRAFT 상태가 아님' })
  @ApiResponse({ status: 404, description: '기준서 없음' })
  async addItem(@Param('id') id: string, @Body() dto: CreateStandardItemDto) {
    return this.service.addItem(id, dto);
  }

  /**
   * 검사 항목 수정
   */
  @Put(':id/items/:itemId')
  @ApiOperation({ summary: '검사 항목 수정' })
  @ApiResponse({ status: 200, description: '항목 수정 성공' })
  @ApiResponse({ status: 404, description: '항목 없음' })
  async updateItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateStandardItemDto,
  ) {
    return this.service.updateItem(id, itemId, dto);
  }

  /**
   * 검사 항목 삭제 (소프트)
   */
  @Delete(':id/items/:itemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '검사 항목 삭제 (소프트)' })
  @ApiResponse({ status: 204, description: '항목 삭제 성공' })
  @ApiResponse({ status: 404, description: '항목 없음' })
  async deleteItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Query('deletedBy') deletedBy?: string,
  ): Promise<void> {
    return this.service.deleteItem(id, itemId, deletedBy);
  }
}

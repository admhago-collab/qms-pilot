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

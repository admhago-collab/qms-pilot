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

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

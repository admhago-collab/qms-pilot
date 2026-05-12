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

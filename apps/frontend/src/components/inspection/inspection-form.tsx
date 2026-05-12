'use client';

import { useState } from 'react';
import { InspectionType, CreateInspectionLotRequest } from '@/types';
import { useInspectionStandardStore } from '@/stores';

interface InspectionFormProps {
  inspectionType: InspectionType;
  onSubmit: (data: CreateInspectionLotRequest) => void;
  onCancel: () => void;
  initialData?: Partial<CreateInspectionLotRequest>;
  onStandardLoaded?: (items: any[]) => void;
}

type FormData = {
  lotNo: string;
  itemCode: string;
  itemName?: string;
  inspectionDate?: string;
  inspector?: string;
  lotQty?: number;
  sampleQty?: number;
  supplierCode?: string;
  supplierName?: string;
  poNo?: string;
  workOrderNo?: string;
  remarks?: string;
};

/**
 * 검사 로트 입력 폼 컴포넌트
 */
export function InspectionForm({
  inspectionType,
  onSubmit,
  onCancel,
  initialData,
  onStandardLoaded,
}: InspectionFormProps) {
  const [formData, setFormData] = useState<FormData>({
    lotNo: initialData?.lotNo || '',
    itemCode: initialData?.itemCode || '',
    itemName: initialData?.itemName || '',
    inspectionDate: initialData?.inspectionDate || new Date().toISOString().split('T')[0],
    inspector: initialData?.inspector || '',
    lotQty: initialData?.lotQty,
    sampleQty: initialData?.sampleQty,
    supplierCode: initialData?.supplierCode || '',
    supplierName: initialData?.supplierName || '',
    poNo: initialData?.poNo || '',
    workOrderNo: initialData?.workOrderNo || '',
    remarks: initialData?.remarks || '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const handleChange = (field: keyof FormData, value: string | number | undefined) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when field is edited
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    
    if (!formData.lotNo.trim()) {
      newErrors.lotNo = '로트 번호를 입력하세요';
    }
    if (!formData.itemCode.trim()) {
      newErrors.itemCode = '품목 코드를 입력하세요';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        inspectionType,
      } as CreateInspectionLotRequest);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Lot No */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            로트 번호 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.lotNo}
            onChange={(e) => handleChange('lotNo', e.target.value)}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-primary-500 focus:outline-hidden focus:ring-1 focus:ring-primary-500"
            placeholder="LOT-20240319-001"
          />
          {errors.lotNo && (
            <p className="text-xs text-red-500">{errors.lotNo}</p>
          )}
        </div>

        {/* Inspection Type (read-only) */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            검사 유형
          </label>
          <input
            type="text"
            value={inspectionType}
            disabled
            className="w-full rounded-md border border-border bg-gray-100 px-3 py-2 text-sm dark:bg-gray-800"
          />
        </div>

        {/* Item Code */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            품목 코드 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.itemCode}
            onChange={(e) => handleChange('itemCode', e.target.value)}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-primary-500 focus:outline-hidden focus:ring-1 focus:ring-primary-500"
            placeholder="ITEM-001"
          />
          {errors.itemCode && (
            <p className="text-xs text-red-500">{errors.itemCode}</p>
          )}
        </div>

        {/* Item Name */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            품목명
          </label>
          <input
            type="text"
            value={formData.itemName || ''}
            onChange={(e) => handleChange('itemName', e.target.value)}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-primary-500 focus:outline-hidden focus:ring-1 focus:ring-primary-500"
            placeholder="알루미늄 케이스"
          />
        </div>

        {/* Inspection Date */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            검사일
          </label>
          <input
            type="date"
            value={formData.inspectionDate || ''}
            onChange={(e) => handleChange('inspectionDate', e.target.value)}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-primary-500 focus:outline-hidden focus:ring-1 focus:ring-primary-500"
          />
        </div>

        {/* Inspector */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            검사자
          </label>
          <input
            type="text"
            value={formData.inspector || ''}
            onChange={(e) => handleChange('inspector', e.target.value)}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-primary-500 focus:outline-hidden focus:ring-1 focus:ring-primary-500"
            placeholder="김품질"
          />
        </div>

        {/* Lot Qty */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            로트 수량
          </label>
          <input
            type="number"
            value={formData.lotQty ?? ''}
            onChange={(e) => handleChange('lotQty', e.target.value ? parseInt(e.target.value) : undefined)}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-primary-500 focus:outline-hidden focus:ring-1 focus:ring-primary-500"
            placeholder="1000"
          />
        </div>

        {/* Sample Qty */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            샘플 수량
          </label>
          <input
            type="number"
            value={formData.sampleQty ?? ''}
            onChange={(e) => handleChange('sampleQty', e.target.value ? parseInt(e.target.value) : undefined)}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-primary-500 focus:outline-hidden focus:ring-1 focus:ring-primary-500"
            placeholder="32"
          />
        </div>

        {/* Supplier Code */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            공급업체 코드
          </label>
          <input
            type="text"
            value={formData.supplierCode || ''}
            onChange={(e) => handleChange('supplierCode', e.target.value)}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-primary-500 focus:outline-hidden focus:ring-1 focus:ring-primary-500"
            placeholder="SUP-001"
          />
        </div>

        {/* Supplier Name */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            공급업처이름
          </label>
          <input
            type="text"
            value={formData.supplierName || ''}
            onChange={(e) => handleChange('supplierName', e.target.value)}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-primary-500 focus:outline-hidden focus:ring-1 focus:ring-primary-500"
            placeholder="ABC공업"
          />
        </div>

        {/* PO No */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            발주번호
          </label>
          <input
            type="text"
            value={formData.poNo || ''}
            onChange={(e) => handleChange('poNo', e.target.value)}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-primary-500 focus:outline-hidden focus:ring-1 focus:ring-primary-500"
            placeholder="PO-20240319-001"
          />
        </div>

        {/* Work Order No */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            작업지시번호
          </label>
          <input
            type="text"
            value={formData.workOrderNo || ''}
            onChange={(e) => handleChange('workOrderNo', e.target.value)}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-primary-500 focus:outline-hidden focus:ring-1 focus:ring-primary-500"
            placeholder="WO-20240319-001"
          />
        </div>

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
      </div>

      {/* Remarks */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          비고
        </label>
        <textarea
          value={formData.remarks || ''}
          onChange={(e) => handleChange('remarks', e.target.value)}
          rows={3}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-primary-500 focus:outline-hidden focus:ring-1 focus:ring-primary-500"
          placeholder="추가 참고사항을 입력하세요"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {isSubmitting ? '저장 중...' : '저장'}
        </button>
      </div>
    </form>
  );
}

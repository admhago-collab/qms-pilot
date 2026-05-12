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

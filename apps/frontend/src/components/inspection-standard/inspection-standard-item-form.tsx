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

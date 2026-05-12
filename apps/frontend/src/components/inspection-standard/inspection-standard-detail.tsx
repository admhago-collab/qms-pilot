'use client';

import { useState } from 'react';
import { X, Plus, Edit2, Trash2, Star } from 'lucide-react';
import {
  InspectionStandard,
  InspectionStandardStatus,
  InspectionStandardItem,
  CreateInspectionStandardItemRequest,
  INPUT_TYPE_LABELS,
  STANDARD_STATUS_LABELS,
} from '@/types';
import { useInspectionStandardStore } from '@/stores';
import { Button } from '@/components/ui/button';
import { InspectionStandardItemForm } from './inspection-standard-item-form';

interface InspectionStandardDetailProps {
  standard: InspectionStandard;
  onClose: () => void;
  onRefresh: () => void;
}

export function InspectionStandardDetail({ standard, onClose, onRefresh }: InspectionStandardDetailProps) {
  const { activateStandard, createNewVersion, addItem, updateItem, deleteItem, isSubmitting } =
    useInspectionStandardStore();

  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState<InspectionStandardItem | null>(null);

  const handleActivate = async () => {
    const approvedBy = prompt('승인자 이름을 입력하세요:');
    if (approvedBy === null) return;
    const ok = await activateStandard(standard.standardId, approvedBy || undefined);
    if (ok) onRefresh();
  };

  const handleNewVersion = async () => {
    const newStd = await createNewVersion(standard.standardId);
    if (newStd) onRefresh();
  };

  const handleAddItem = async (data: CreateInspectionStandardItemRequest) => {
    await addItem(standard.standardId, data);
    setShowItemForm(false);
    onRefresh();
  };

  const handleUpdateItem = async (data: CreateInspectionStandardItemRequest) => {
    if (!editingItem) return;
    await updateItem(standard.standardId, editingItem.standardItemId, data);
    setEditingItem(null);
    onRefresh();
  };

  const handleDeleteItem = async (item: InspectionStandardItem) => {
    if (!confirm(`'${item.characteristicName}' 항목을 삭제하시겠습니까?`)) return;
    await deleteItem(standard.standardId, item.standardItemId);
    onRefresh();
  };

  const isDraft = standard.status === InspectionStandardStatus.DRAFT;

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-[680px] bg-background-white dark:bg-background-dark shadow-2xl border-l border-border flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h2 className="font-semibold text-gray-900 dark:text-white">
            {standard.standardNo} <span className="text-sm font-normal text-gray-500">v{standard.version}</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {standard.supplierCode} ({standard.supplierName}) / {standard.itemCode} ({standard.itemName})
          </p>
        </div>
        <button onClick={onClose} aria-label="닫기" className="text-gray-400 hover:text-gray-600">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 border-b border-border px-5 py-3">
        <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${
          standard.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
          standard.status === 'DRAFT' ? 'bg-gray-100 text-gray-700' :
          standard.status === 'SUPERSEDED' ? 'bg-yellow-100 text-yellow-700' :
          'bg-red-100 text-red-700'
        }`}>
          {STANDARD_STATUS_LABELS[standard.status]}
        </span>
        {isDraft && (
          <Button size="sm" onClick={handleActivate} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
            승인 (ACTIVE)
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={handleNewVersion} disabled={isSubmitting}>
          새 버전
        </Button>
      </div>

      {/* Standard info */}
      <div className="grid grid-cols-3 gap-3 px-5 py-3 bg-gray-50 dark:bg-gray-800 text-sm border-b border-border">
        <div><span className="text-xs text-gray-500">적용일</span><p>{standard.effectiveDate?.slice(0, 10) ?? '-'}</p></div>
        <div><span className="text-xs text-gray-500">만료일</span><p>{standard.expiryDate?.slice(0, 10) ?? '-'}</p></div>
        <div><span className="text-xs text-gray-500">승인자</span><p>{standard.approvedBy ?? '-'}</p></div>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            검사항목 ({standard.items?.length ?? 0}개)
          </h3>
          {isDraft && (
            <Button size="sm" onClick={() => setShowItemForm(true)} className="gap-1">
              <Plus className="h-3 w-3" /> 항목추가
            </Button>
          )}
        </div>

        {showItemForm && (
          <div className="px-5 py-4 border-b border-border bg-blue-50 dark:bg-blue-950">
            <h4 className="text-sm font-medium mb-3">새 항목 추가</h4>
            <InspectionStandardItemForm onSubmit={handleAddItem} onCancel={() => setShowItemForm(false)} />
          </div>
        )}

        {editingItem && (
          <div className="px-5 py-4 border-b border-border bg-yellow-50 dark:bg-yellow-950">
            <h4 className="text-sm font-medium mb-3">항목 수정: {editingItem.characteristicName}</h4>
            <InspectionStandardItemForm
              initialData={editingItem}
              onSubmit={handleUpdateItem}
              onCancel={() => setEditingItem(null)}
            />
          </div>
        )}

        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800 text-left border-b border-border">
              <th className="px-3 py-2 text-gray-500">No</th>
              <th className="px-3 py-2 text-gray-500">특성명</th>
              <th className="px-3 py-2 text-gray-500">입력구분</th>
              <th className="px-3 py-2 text-gray-500">규격</th>
              <th className="px-3 py-2 text-gray-500">적용유형</th>
              <th className="px-3 py-2 text-gray-500">검사방법</th>
              {isDraft && <th className="px-3 py-2"></th>}
            </tr>
          </thead>
          <tbody>
            {(standard.items ?? []).map((item) => (
              <tr key={item.standardItemId} className="border-b border-border hover:bg-surface dark:hover:bg-surface-dark">
                <td className="px-3 py-2 text-gray-500">{item.sequenceNo}</td>
                <td className="px-3 py-2 font-medium">
                  {item.isCritical && <Star className="inline h-3 w-3 text-yellow-500 mr-1 fill-current" />}
                  {item.characteristicName}
                  {item.characteristicNo && <span className="ml-1 text-gray-400">({item.characteristicNo})</span>}
                </td>
                <td className="px-3 py-2">{INPUT_TYPE_LABELS[item.inputType]}</td>
                <td className="px-3 py-2 text-gray-600">
                  {item.specMin !== undefined && item.specMax !== undefined
                    ? `${item.specMin} ~ ${item.specMax}${item.unit ? ` ${item.unit}` : ''}`
                    : item.specText ?? '-'}
                </td>
                <td className="px-3 py-2">
                  {item.applicableTypes ? item.applicableTypes.join(', ') : '전체'}
                </td>
                <td className="px-3 py-2 text-gray-500">{item.inspectionMethod ?? '-'}</td>
                {isDraft && (
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      <button onClick={() => setEditingItem(item)} aria-label="항목 수정" className="text-gray-400 hover:text-primary">
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleDeleteItem(item)} aria-label="항목 삭제" className="text-gray-400 hover:text-red-500">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {(standard.items ?? []).length === 0 && (
              <tr>
                <td colSpan={isDraft ? 7 : 6} className="px-3 py-6 text-center text-gray-400">
                  등록된 검사항목이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

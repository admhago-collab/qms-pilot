'use client';

import { InspectionStandard, InspectionStandardStatus, STANDARD_STATUS_LABELS } from '@/types';

interface InspectionStandardTableProps {
  data: InspectionStandard[];
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onRowClick: (standard: InspectionStandard) => void;
  isLoading: boolean;
}

const statusColors: Record<InspectionStandardStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  ACTIVE: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  SUPERSEDED: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  INACTIVE: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
};

export function InspectionStandardTable({
  data,
  total,
  page,
  limit,
  onPageChange,
  onRowClick,
  isLoading,
}: InspectionStandardTableProps) {
  const totalPages = Math.ceil(total / limit);

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-gray-500">
        로딩 중...
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-gray-500">
        등록된 검사기준서가 없습니다.
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-gray-50 dark:bg-gray-800 text-left">
              <th className="px-3 py-2 font-medium text-gray-600 dark:text-gray-400">기준서번호</th>
              <th className="px-3 py-2 font-medium text-gray-600 dark:text-gray-400">공급업체</th>
              <th className="px-3 py-2 font-medium text-gray-600 dark:text-gray-400">품목코드</th>
              <th className="px-3 py-2 font-medium text-gray-600 dark:text-gray-400">품목명</th>
              <th className="px-3 py-2 font-medium text-gray-600 dark:text-gray-400 text-center">버전</th>
              <th className="px-3 py-2 font-medium text-gray-600 dark:text-gray-400 text-center">상태</th>
              <th className="px-3 py-2 font-medium text-gray-600 dark:text-gray-400">적용일</th>
              <th className="px-3 py-2 font-medium text-gray-600 dark:text-gray-400">승인자</th>
              <th className="px-3 py-2 font-medium text-gray-600 dark:text-gray-400 text-center">항목수</th>
            </tr>
          </thead>
          <tbody>
            {data.map((std) => (
              <tr
                key={std.standardId}
                onClick={() => onRowClick(std)}
                className="border-b border-border cursor-pointer hover:bg-surface dark:hover:bg-surface-dark transition-colors"
              >
                <td className="px-3 py-2 font-mono text-xs text-primary">{std.standardNo}</td>
                <td className="px-3 py-2">{std.supplierCode}<br /><span className="text-xs text-gray-500">{std.supplierName}</span></td>
                <td className="px-3 py-2 font-mono text-xs">{std.itemCode}</td>
                <td className="px-3 py-2">{std.itemName ?? '-'}</td>
                <td className="px-3 py-2 text-center font-medium">v{std.version}</td>
                <td className="px-3 py-2 text-center">
                  <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${statusColors[std.status]}`}>
                    {STANDARD_STATUS_LABELS[std.status]}
                  </span>
                </td>
                <td className="px-3 py-2 text-xs">{std.effectiveDate ? std.effectiveDate.slice(0, 10) : '-'}</td>
                <td className="px-3 py-2 text-xs">{std.approvedBy ?? '-'}</td>
                <td className="px-3 py-2 text-center">{std.itemCount ?? 0}개</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border px-3 py-2 mt-2">
          <span className="text-xs text-gray-500">총 {total}건</span>
          <div className="flex gap-1">
            <button
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="rounded px-2 py-1 text-xs border border-border disabled:opacity-40 hover:bg-surface"
            >
              이전
            </button>
            <span className="px-2 py-1 text-xs">{page} / {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="rounded px-2 py-1 text-xs border border-border disabled:opacity-40 hover:bg-surface"
            >
              다음
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

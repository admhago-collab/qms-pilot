'use client';

import { useState, useEffect } from 'react';
import { Plus, Filter, X, BookOpen } from 'lucide-react';
import { InspectionStandard, InspectionStandardStatus, STANDARD_STATUS_LABELS } from '@/types';
import { useInspectionStandardStore } from '@/stores';
import { Button } from '@/components/ui/button';
import { InspectionStandardTable } from './inspection-standard-table';
import { InspectionStandardForm } from './inspection-standard-form';
import { InspectionStandardDetail } from './inspection-standard-detail';

export function InspectionStandardPageContent() {
  const {
    standards, total, page, limit, isLoading,
    fetchStandards, fetchStandard, createStandard, setPage, selectedStandard, setSelectedStandard,
  } = useInspectionStandardStore();

  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({ supplierCode: '', itemCode: '', status: '' });

  useEffect(() => {
    fetchStandards({ page, limit });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  const applyFilters = () => {
    fetchStandards({
      supplierCode: filters.supplierCode || undefined,
      itemCode: filters.itemCode || undefined,
      status: (filters.status as InspectionStandardStatus) || undefined,
      page: 1,
      limit,
    });
  };

  const resetFilters = () => {
    setFilters({ supplierCode: '', itemCode: '', status: '' });
    fetchStandards({ page: 1, limit });
  };

  const handleRowClick = async (std: InspectionStandard) => {
    await fetchStandard(std.standardId);
  };

  const handleCreateStandard = async (data: Parameters<typeof createStandard>[0]) => {
    const created = await createStandard(data);
    if (created) {
      setShowForm(false);
      fetchStandards({ page: 1, limit });
    }
  };

  const handleDetailClose = () => {
    setSelectedStandard(null);
  };

  const handleRefresh = () => {
    if (selectedStandard) fetchStandard(selectedStandard.standardId);
    fetchStandards({ page, limit });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            검사기준서 관리
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Inspection Standard Management — 공급업체+품목별 검사 기준 정의
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          새 기준서
        </Button>
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-border bg-surface p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">검색 필터</span>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="text-xs text-gray-600 dark:text-gray-400">공급업체 코드</label>
            <input
              type="text"
              value={filters.supplierCode}
              onChange={(e) => setFilters((p) => ({ ...p, supplierCode: e.target.value }))}
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm"
              placeholder="SUP-001"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600 dark:text-gray-400">품목 코드</label>
            <input
              type="text"
              value={filters.itemCode}
              onChange={(e) => setFilters((p) => ({ ...p, itemCode: e.target.value }))}
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm"
              placeholder="ITEM-001"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600 dark:text-gray-400">상태</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm"
            >
              <option value="">전체</option>
              {Object.entries(STANDARD_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <Button onClick={applyFilters} className="flex-1">검색</Button>
            <Button onClick={resetFilters} variant="outline"><X className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-surface p-4">
        <InspectionStandardTable
          data={standards}
          total={total}
          page={page}
          limit={limit}
          onPageChange={setPage}
          onRowClick={handleRowClick}
          isLoading={isLoading}
        />
      </div>

      {/* New Standard Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-2xl rounded-lg bg-white p-6 dark:bg-gray-900">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">새 검사기준서 등록</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <InspectionStandardForm onSubmit={handleCreateStandard} onCancel={() => setShowForm(false)} />
          </div>
        </div>
      )}

      {/* Detail Panel */}
      {selectedStandard && (
        <>
          <div className="fixed inset-0 z-30 bg-black/20" onClick={handleDetailClose} />
          <InspectionStandardDetail
            standard={selectedStandard}
            onClose={handleDetailClose}
            onRefresh={handleRefresh}
          />
        </>
      )}
    </div>
  );
}

/**
 * @file inspection-page-content.tsx
 * @description 검사 페이지 공통 컨텐츠 컴포넌트 - IQC/IPQC/FQC/OQC 공통 UI
 * 초보자 가이드: 각 검사 타입별 page.tsx에서 inspectionType prop으로 구분하여 사용
 */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus, Filter, X, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { InspectionType, InspectionJudgment, InspectionStatus } from '@/types';
import { useInspectionStore } from '@/stores';
import {
  InspectionTable,
  InspectionForm,
  InspectionResultInput,
} from '@/components/inspection';
import { Button } from '@/components/ui/button';

const inspectionConfig = {
  [InspectionType.IQC]: {
    title: '수입검사 (IQC)',
    titleEn: 'Incoming Quality Control',
    description: '원자재 및 부품 수입 검사 관리',
    icon: Search,
  },
  [InspectionType.IPQC]: {
    title: '공정검사 (IPQC)',
    titleEn: 'In-Process Quality Control',
    description: '생산 공정 중 품질 검사 관리',
    icon: Search,
  },
  [InspectionType.FQC]: {
    title: '최종검사 (FQC)',
    titleEn: 'Final Quality Control',
    description: '완제품 최종 품질 검사 관리',
    icon: Search,
  },
  [InspectionType.OQC]: {
    title: '출하검사 (OQC)',
    titleEn: 'Outgoing Quality Control',
    description: '출하 전 품질 검사 관리',
    icon: Search,
  },
};

interface InspectionPageContentProps {
  inspectionType?: InspectionType;
}

export function InspectionPageContent({ inspectionType = InspectionType.IQC }: InspectionPageContentProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const config = inspectionConfig[inspectionType];
  const Icon = config.icon;

  const {
    lots,
    total,
    page,
    limit,
    isLoading,
    selectedLot,
    fetchLots,
    setPage,
    setLimit,
    setSelectedLot,
    createLot,
    judgeLot,
  } = useInspectionStore();

  const [showForm, setShowForm] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showNcrModal, setShowNcrModal] = useState(false);
  const [judgeResult, setJudgeResult] = useState<{ autoNcrCreated: boolean; ncrNo?: string } | null>(null);
  const [filters, setFilters] = useState({
    lotNo: '',
    itemCode: '',
    itemName: '',
    judgment: '',
    status: '',
    inspectionDateFrom: '',
    inspectionDateTo: '',
  });

  useEffect(() => {
    fetchLots({ inspectionType, page, limit });
  }, [inspectionType, page, limit, fetchLots]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    fetchLots({
      inspectionType,
      ...filters,
      page: 1,
      limit,
    } as any);
  };

  const resetFilters = () => {
    setFilters({
      lotNo: '',
      itemCode: '',
      itemName: '',
      judgment: '',
      status: '',
      inspectionDateFrom: '',
      inspectionDateTo: '',
    });
    fetchLots({ inspectionType, page: 1, limit });
  };

  const handleCreateLot = async (data: any) => {
    const success = await createLot(data);
    if (success) {
      setShowForm(false);
      fetchLots({ inspectionType, page, limit });
    }
  };

  const handleJudgeLot = async (judgment: InspectionJudgment) => {
    if (!selectedLot) return;

    const result = await judgeLot(selectedLot.lotNo, judgment);
    if (result) {
      setJudgeResult(result);
      if (result.autoNcrCreated) {
        setShowNcrModal(true);
      }
      setShowResults(false);
    }
  };

  const goToNcr = () => {
    if (judgeResult?.ncrNo) {
      router.push(`/nonconformance/ncr?ncrNo=${judgeResult.ncrNo}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Icon className="h-6 w-6" />
            {config.title}
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {config.titleEn} - {config.description}
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          새 검사
        </Button>
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-border bg-surface p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            검색 필터
          </span>
        </div>
        <div className="grid grid-cols-6 gap-4">
          <div>
            <label className="text-xs text-gray-600 dark:text-gray-400">로트 번호</label>
            <input
              type="text"
              value={filters.lotNo}
              onChange={(e) => handleFilterChange('lotNo', e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm"
              placeholder="LOT-..."
            />
          </div>
          <div>
            <label className="text-xs text-gray-600 dark:text-gray-400">품목 코드</label>
            <input
              type="text"
              value={filters.itemCode}
              onChange={(e) => handleFilterChange('itemCode', e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm"
              placeholder="ITEM-..."
            />
          </div>
          <div>
            <label className="text-xs text-gray-600 dark:text-gray-400">품목명</label>
            <input
              type="text"
              value={filters.itemName}
              onChange={(e) => handleFilterChange('itemName', e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm"
              placeholder="품목명..."
            />
          </div>
          <div>
            <label className="text-xs text-gray-600 dark:text-gray-400">판정</label>
            <select
              value={filters.judgment}
              onChange={(e) => handleFilterChange('judgment', e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm"
            >
              <option value="">전체</option>
              <option value={InspectionJudgment.PASS}>합격</option>
              <option value={InspectionJudgment.FAIL}>불합격</option>
              <option value={InspectionJudgment.HOLD}>보류</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-600 dark:text-gray-400">상태</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm"
            >
              <option value="">전체</option>
              <option value={InspectionStatus.PENDING}>대기</option>
              <option value={InspectionStatus.IN_PROGRESS}>진행중</option>
              <option value={InspectionStatus.COMPLETED}>완료</option>
              <option value={InspectionStatus.CANCELLED}>취소</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            <Button onClick={applyFilters} variant="default" className="flex-1">
              검색
            </Button>
            <Button onClick={resetFilters} variant="outline">
              초기화
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div>
            <label className="text-xs text-gray-600 dark:text-gray-400">검사일 (부터)</label>
            <input
              type="date"
              value={filters.inspectionDateFrom}
              onChange={(e) => handleFilterChange('inspectionDateFrom', e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600 dark:text-gray-400">검사일 (까지)</label>
            <input
              type="date"
              value={filters.inspectionDateTo}
              onChange={(e) => handleFilterChange('inspectionDateTo', e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-surface p-4">
        <InspectionTable
          data={lots}
          total={total}
          page={page}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={setLimit}
          onRowClick={(lot) => {
            setSelectedLot(lot);
            setShowResults(true);
          }}
          isLoading={isLoading}
        />
      </div>

      {/* New Inspection Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-3xl rounded-lg bg-white p-6 dark:bg-gray-900">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                새 검사 로트 생성
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <InspectionForm
              inspectionType={inspectionType}
              onSubmit={handleCreateLot}
              onCancel={() => setShowForm(false)}
              onStandardLoaded={(items) => {
                console.log('Loaded standard items:', items.map((it: any) => it.characteristicName));
              }}
            />
          </div>
        </div>
      )}

      {/* Results Modal */}
      {showResults && selectedLot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-lg bg-white p-6 dark:bg-gray-900">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  검사 결과 입력
                </h2>
                <p className="text-sm text-gray-500">
                  로트: {selectedLot.lotNo} | 품목: {selectedLot.itemCode}
                </p>
              </div>
              <button
                onClick={() => setShowResults(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4 grid grid-cols-4 gap-4 rounded-md bg-gray-50 p-4 dark:bg-gray-800">
              <div>
                <span className="text-xs text-gray-500">로트 번호</span>
                <p className="font-medium">{selectedLot.lotNo}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">품목 코드</span>
                <p className="font-medium">{selectedLot.itemCode}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">로트 수량</span>
                <p className="font-medium">{selectedLot.lotQty?.toLocaleString() || '-'}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">현재 상태</span>
                <p className="font-medium">{selectedLot.status}</p>
              </div>
            </div>

            <InspectionResultInput
              lotNo={selectedLot.lotNo}
              results={[]}
              onChange={(results) => {
                console.log('Results:', results);
              }}
            />

            <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
              <div className="flex gap-2">
                <Button
                  onClick={() => handleJudgeLot(InspectionJudgment.PASS)}
                  className="gap-2 bg-green-600 hover:bg-green-700"
                >
                  <FileText className="h-4 w-4" />
                  합격 판정
                </Button>
                <Button
                  onClick={() => handleJudgeLot(InspectionJudgment.FAIL)}
                  variant="destructive"
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  불합격 판정
                </Button>
              </div>
              <Button onClick={() => setShowResults(false)} variant="outline">
                닫기
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* NCR Created Modal */}
      {showNcrModal && judgeResult?.ncrNo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-gray-900">
            <div className="mb-4 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <FileText className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                NCR 자동 생성됨
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                불합격 판정으로 인해 NCR이 자동 생성되었습니다.
              </p>
              <p className="mt-2 text-lg font-medium text-primary-600">
                {judgeResult.ncrNo}
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={goToNcr} className="flex-1">
                NCR 확인하기
              </Button>
              <Button onClick={() => setShowNcrModal(false)} variant="outline">
                닫기
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { create } from 'zustand';
import {
  InspectionStandard,
  InspectionStandardItem,
  InspectionStandardQueryParams,
  CreateInspectionStandardRequest,
  CreateInspectionStandardItemRequest,
  UpdateInspectionStandardItemRequest,
  PaginatedInspectionStandards,
  InspectionStandardStatus,
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005/api/v1';

interface InspectionStandardState {
  standards: InspectionStandard[];
  selectedStandard: InspectionStandard | null;
  total: number;
  page: number;
  limit: number;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;

  fetchStandards: (params?: InspectionStandardQueryParams) => Promise<void>;
  fetchStandard: (standardId: string) => Promise<void>;
  createStandard: (data: CreateInspectionStandardRequest) => Promise<InspectionStandard | null>;
  updateStandard: (standardId: string, data: Partial<CreateInspectionStandardRequest>) => Promise<boolean>;
  activateStandard: (standardId: string, approvedBy?: string) => Promise<boolean>;
  createNewVersion: (standardId: string, createdBy?: string) => Promise<InspectionStandard | null>;
  addItem: (standardId: string, data: CreateInspectionStandardItemRequest) => Promise<InspectionStandardItem | null>;
  updateItem: (standardId: string, itemId: string, data: UpdateInspectionStandardItemRequest) => Promise<boolean>;
  deleteItem: (standardId: string, itemId: string) => Promise<boolean>;
  fetchActiveStandard: (supplierCode: string, itemCode: string, inspectionType?: string) => Promise<InspectionStandard | null>;
  setSelectedStandard: (standard: InspectionStandard | null) => void;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  clearError: () => void;
}

export const useInspectionStandardStore = create<InspectionStandardState>()(
  (set, get) => ({
    standards: [],
    selectedStandard: null,
    total: 0,
    page: 1,
    limit: 20,
    isLoading: false,
    isSubmitting: false,
    error: null,

    fetchStandards: async (params = {}) => {
      set({ isLoading: true, error: null });
      try {
        const { page, limit } = get();
        const queryParams = new URLSearchParams({
          page: String(params.page ?? page),
          limit: String(params.limit ?? limit),
          ...Object.entries(params).reduce((acc, [k, v]) => {
            if (v !== undefined && v !== null) acc[k] = String(v);
            return acc;
          }, {} as Record<string, string>),
        });
        const res = await fetch(`${API_BASE_URL}/inspection-standards?${queryParams}`);
        if (!res.ok) throw new Error('Failed to fetch standards');
        const data: PaginatedInspectionStandards = await res.json();
        set({ standards: data.items, total: data.total, page: data.page, limit: data.limit, isLoading: false });
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Unknown error', isLoading: false });
      }
    },

    fetchStandard: async (standardId) => {
      set({ isLoading: true, error: null });
      try {
        const res = await fetch(`${API_BASE_URL}/inspection-standards/${standardId}`);
        if (!res.ok) throw new Error('Failed to fetch standard');
        const standard: InspectionStandard = await res.json();
        set({ selectedStandard: standard, isLoading: false });
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Unknown error', isLoading: false });
      }
    },

    createStandard: async (data) => {
      set({ isSubmitting: true, error: null });
      try {
        const res = await fetch(`${API_BASE_URL}/inspection-standards`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || 'Failed to create standard');
        }
        const standard: InspectionStandard = await res.json();
        set((s) => ({ standards: [standard, ...s.standards], total: s.total + 1, isSubmitting: false }));
        return standard;
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Unknown error', isSubmitting: false });
        return null;
      }
    },

    updateStandard: async (standardId, data) => {
      set({ isSubmitting: true, error: null });
      try {
        const res = await fetch(`${API_BASE_URL}/inspection-standards/${standardId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || 'Failed to update standard');
        }
        const updated: InspectionStandard = await res.json();
        set((s) => ({
          standards: s.standards.map((st) => (st.standardId === standardId ? { ...st, ...updated } : st)),
          selectedStandard: s.selectedStandard?.standardId === standardId ? { ...s.selectedStandard, ...updated } : s.selectedStandard,
          isSubmitting: false,
        }));
        return true;
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Unknown error', isSubmitting: false });
        return false;
      }
    },

    activateStandard: async (standardId, approvedBy) => {
      set({ isSubmitting: true, error: null });
      try {
        const query = approvedBy ? `?approvedBy=${encodeURIComponent(approvedBy)}` : '';
        const res = await fetch(`${API_BASE_URL}/inspection-standards/${standardId}/activate${query}`, {
          method: 'POST',
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || 'Failed to activate standard');
        }
        const updated: InspectionStandard = await res.json();
        set((s) => ({
          standards: s.standards.map((st) =>
            st.standardId === standardId
              ? { ...st, ...updated }
              : st.supplierCode === updated.supplierCode && st.itemCode === updated.itemCode && st.status === InspectionStandardStatus.ACTIVE
              ? { ...st, status: InspectionStandardStatus.SUPERSEDED }
              : st
          ),
          selectedStandard: s.selectedStandard?.standardId === standardId ? { ...s.selectedStandard, ...updated } : s.selectedStandard,
          isSubmitting: false,
        }));
        return true;
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Unknown error', isSubmitting: false });
        return false;
      }
    },

    createNewVersion: async (standardId, createdBy) => {
      set({ isSubmitting: true, error: null });
      try {
        const query = createdBy ? `?createdBy=${encodeURIComponent(createdBy)}` : '';
        const res = await fetch(`${API_BASE_URL}/inspection-standards/${standardId}/new-version${query}`, {
          method: 'POST',
        });
        if (!res.ok) throw new Error('Failed to create new version');
        const newStandard: InspectionStandard = await res.json();
        set((s) => ({ standards: [newStandard, ...s.standards], total: s.total + 1, isSubmitting: false }));
        return newStandard;
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Unknown error', isSubmitting: false });
        return null;
      }
    },

    addItem: async (standardId, data) => {
      set({ isSubmitting: true, error: null });
      try {
        const res = await fetch(`${API_BASE_URL}/inspection-standards/${standardId}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to add item');
        const item: InspectionStandardItem = await res.json();
        set((s) => ({
          selectedStandard: s.selectedStandard?.standardId === standardId
            ? { ...s.selectedStandard, items: [...(s.selectedStandard.items ?? []), item] }
            : s.selectedStandard,
          isSubmitting: false,
        }));
        return item;
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Unknown error', isSubmitting: false });
        return null;
      }
    },

    updateItem: async (standardId, itemId, data) => {
      set({ isSubmitting: true, error: null });
      try {
        const res = await fetch(`${API_BASE_URL}/inspection-standards/${standardId}/items/${itemId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to update item');
        const updated: InspectionStandardItem = await res.json();
        set((s) => ({
          selectedStandard: s.selectedStandard?.standardId === standardId
            ? {
                ...s.selectedStandard,
                items: (s.selectedStandard.items ?? []).map((it) =>
                  it.standardItemId === itemId ? updated : it
                ),
              }
            : s.selectedStandard,
          isSubmitting: false,
        }));
        return true;
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Unknown error', isSubmitting: false });
        return false;
      }
    },

    deleteItem: async (standardId, itemId) => {
      set({ isSubmitting: true, error: null });
      try {
        const res = await fetch(`${API_BASE_URL}/inspection-standards/${standardId}/items/${itemId}`, {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to delete item');
        set((s) => ({
          selectedStandard: s.selectedStandard?.standardId === standardId
            ? {
                ...s.selectedStandard,
                items: (s.selectedStandard.items ?? []).filter((it) => it.standardItemId !== itemId),
              }
            : s.selectedStandard,
          isSubmitting: false,
        }));
        return true;
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Unknown error', isSubmitting: false });
        return false;
      }
    },

    fetchActiveStandard: async (supplierCode, itemCode, inspectionType) => {
      try {
        const params = new URLSearchParams({ supplierCode, itemCode });
        if (inspectionType) params.set('inspectionType', inspectionType);
        const res = await fetch(`${API_BASE_URL}/inspection-standards/active?${params}`);
        if (!res.ok) return null;
        return await res.json() as InspectionStandard;
      } catch {
        return null;
      }
    },

    setSelectedStandard: (standard) => set({ selectedStandard: standard }),
    setPage: (page) => set({ page }),
    setLimit: (limit) => set({ limit, page: 1 }),
    clearError: () => set({ error: null }),
  })
);

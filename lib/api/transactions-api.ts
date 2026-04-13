import { apiClient } from "@/lib/api/client";
import type { ApiResponse, PaginatedApiResponse } from "@/types/api";
import type { InventoryTransaction, TransactionStatus, TransactionType } from "@/types/entities";

type SortBy = "createdAt" | "quantity";
type SortOrder = "asc" | "desc";

export interface TransactionListParams {
  page?: number;
  limit?: number;
  itemId?: number;
  type?: TransactionType;
  status?: TransactionStatus;
  sortBy?: SortBy;
  order?: SortOrder;
}

interface CreateTransactionPayload {
  itemId: number;
  type: TransactionType;
  quantity: number;
}

export const transactionsApi = {
  async getTransactions(params: TransactionListParams) {
    const response = await apiClient.get<PaginatedApiResponse<InventoryTransaction>>("/transactions", {
      params
    });

    return response.data;
  },

  async createTransaction(payload: CreateTransactionPayload) {
    const response = await apiClient.post<ApiResponse<InventoryTransaction>>("/transactions", payload);
    return response.data.data;
  },

  async approveTransaction(transactionId: number) {
    const response = await apiClient.patch<ApiResponse<InventoryTransaction>>(`/transactions/${transactionId}/approve`);
    return response.data.data;
  },

  async rejectTransaction(transactionId: number) {
    const response = await apiClient.patch<ApiResponse<InventoryTransaction>>(`/transactions/${transactionId}/reject`);
    return response.data.data;
  }
};

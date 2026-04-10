import { apiClient } from "@/lib/api/client";
import type { ApiResponse, PaginatedApiResponse } from "@/types/api";
import type { Item } from "@/types/entities";

export interface ItemListParams {
  page?: number;
  limit?: number;
  search?: string;
}

interface SaveItemPayload {
  name: string;
  stock: number;
  description?: string;
}

export const itemsApi = {
  async getItems(params: ItemListParams) {
    const response = await apiClient.get<PaginatedApiResponse<Item>>("/items", {
      params
    });

    return response.data;
  },

  async createItem(payload: SaveItemPayload) {
    const response = await apiClient.post<ApiResponse<Item>>("/items", payload);
    return response.data.data;
  },

  async updateItem(itemId: number, payload: Partial<SaveItemPayload>) {
    const response = await apiClient.put<ApiResponse<Item>>(`/items/${itemId}`, payload);
    return response.data.data;
  },

  async deleteItem(itemId: number) {
    await apiClient.delete(`/items/${itemId}`);
  }
};

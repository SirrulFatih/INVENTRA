import { apiClient } from "@/lib/api/client";
import type { PaginatedApiResponse } from "@/types/api";
import type { AuditAction, AuditLog, AuditTableName } from "@/types/entities";

export interface AuditLogListParams {
  page?: number;
  limit?: number;
  userId?: number;
  action?: AuditAction;
  tableName?: AuditTableName;
}

export const auditLogsApi = {
  async getAuditLogs(params: AuditLogListParams) {
    const response = await apiClient.get<PaginatedApiResponse<AuditLog>>("/audit-logs", {
      params
    });

    return response.data;
  }
};

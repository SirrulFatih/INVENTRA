export type UserRole = string;

export interface Permission {
  id: number;
  name: string;
}

export interface RoleWithPermissions {
  id: number;
  name: string;
  permissions: Permission[];
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  permissions?: string[];
  createdAt: string;
}

export interface Item {
  id: number;
  name: string;
  stock: number;
  description: string | null;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

export type TransactionType = "IN" | "OUT";
export type TransactionStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface InventoryTransaction {
  id: number;
  itemId: number;
  type: TransactionType;
  quantity: number;
  userId: number;
  status: TransactionStatus;
  approvedBy: string | null;
  approvedAt: string | null;
  createdAt: string;
  item?: {
    id: number;
    name: string;
    stock: number;
  };
  user?: {
    id: number;
    name: string;
    role: UserRole;
  };
}

export type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "LOGIN";
export type AuditTableName = "User" | "Item" | "Transaction";

export interface AuditLog {
  id: number;
  userId: number;
  action: AuditAction;
  tableName: AuditTableName;
  recordId: number;
  description: string | null;
  createdAt: string;
  user?: {
    id: number;
    name: string;
    email: string;
    role: UserRole;
  };
}

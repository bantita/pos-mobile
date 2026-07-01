/**
 * PermissionGuard Component — M10
 * ซ่อน/แสดง children ตาม permission ของ role ปัจจุบัน
 */
import React from 'react';
import { usePermission } from '../../hooks/usePermission';
import { Module, Action } from '../../store/permissionStore';

interface PermissionGuardProps {
  module: Module;
  action: Action;
  /** แสดงแทน children ถ้าไม่มีสิทธิ์ (ถ้าไม่ระบุ จะซ่อนทั้งหมด) */
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  module,
  action,
  fallback = null,
  children,
}) => {
  const { can } = usePermission();

  if (!can(module, action)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

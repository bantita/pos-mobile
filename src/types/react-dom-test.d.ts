/**
 * Test-only ambient declarations สำหรับ react-dom (ไม่มี @types/react-dom ในโปรเจกต์)
 * ใช้ใน src/i18n/__tests__/useT.test.tsx
 */
declare module 'react-dom/client' {
  import type { ReactNode } from 'react';
  export function createRoot(c: Element): { render(n: ReactNode): void; unmount(): void };
}
declare module 'react-dom/test-utils' {
  export function act(cb: () => void | Promise<void>): Promise<void>;
}

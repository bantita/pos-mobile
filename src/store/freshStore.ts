/**
 * freshStore — เช็คว่าเป็นร้านใหม่ (register ใหม่) หรือไม่
 * ถ้าเป็นร้านใหม่ → store ต่างๆ ใช้ [] แทน MOCK data
 * ถ้า login demo → ใช้ MOCK data ตามเดิม
 */
export function isFreshStore(): boolean {
  if (typeof localStorage === 'undefined') return false;
  return localStorage.getItem('pos-fresh-store') === 'true';
}

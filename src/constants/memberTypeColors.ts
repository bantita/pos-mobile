/**
 * memberTypeColors — map คีย์สีของประเภทสมาชิก -> token สี (web / mobile)
 * เก็บเป็น key ใน store เพื่อไม่ hardcode hex และให้ทั้งสองแพลตฟอร์มใช้ token ของตัวเอง
 */
import { MemberTypeColorKey } from '../types/memberType';
import { WebColors } from './webColors';
import { Colors } from './colors';

export const MEMBER_TYPE_COLOR_OPTIONS: { key: MemberTypeColorKey; label: string }[] = [
  { key: 'gray', label: 'เทา' },
  { key: 'blue', label: 'ฟ้า' },
  { key: 'green', label: 'เขียว' },
  { key: 'orange', label: 'ส้ม' },
  { key: 'red', label: 'แดง' },
  { key: 'purple', label: 'ม่วง' },
];

export interface MemberTypeColorPair {
  /** สีตัวอักษร / ขอบ */
  fg: string;
  /** สีพื้นหลัง */
  bg: string;
}

const WEB_MAP: Record<MemberTypeColorKey, MemberTypeColorPair> = {
  gray: { fg: WebColors.textSecondary, bg: WebColors.gray100 },
  blue: { fg: WebColors.info, bg: WebColors.infoLight },
  green: { fg: WebColors.success, bg: WebColors.successLight },
  orange: { fg: WebColors.warning, bg: WebColors.warningLight },
  red: { fg: WebColors.primary, bg: WebColors.primaryLight },
  purple: { fg: WebColors.purple, bg: WebColors.purpleLight },
};

const MOBILE_MAP: Record<MemberTypeColorKey, MemberTypeColorPair> = {
  gray: { fg: Colors.gray600, bg: Colors.gray100 },
  blue: { fg: Colors.info, bg: Colors.infoLight },
  green: { fg: Colors.success, bg: Colors.successLight },
  orange: { fg: Colors.warning, bg: Colors.warningLight },
  red: { fg: Colors.danger, bg: Colors.dangerLight },
  purple: { fg: Colors.accentDark, bg: Colors.accentLight },
};

/** คืนคู่สี fg/bg ของประเภทสมาชิกตามแพลตฟอร์ม (key ไม่รู้จัก -> gray) */
export function getMemberTypeColors(
  key: MemberTypeColorKey | string | undefined,
  platform: 'web' | 'mobile'
): MemberTypeColorPair {
  const map = platform === 'web' ? WEB_MAP : MOBILE_MAP;
  return map[(key as MemberTypeColorKey)] ?? map.gray;
}

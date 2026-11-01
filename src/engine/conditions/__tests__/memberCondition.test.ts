/**
 * Tests — MemberConditionEvaluator: levels + memberTypeIds
 */
import { describe, test, expect } from 'vitest';
import { MemberConditionEvaluator } from '../evaluators/member';
import { EvaluationContext } from '../../types/internal';

const evaluator = new MemberConditionEvaluator();
const ctx = (over: Partial<EvaluationContext>): EvaluationContext => ({
  cart: [], storeCode: 'S', businessDateTime: '2026-01-01T10:00:00', subtotal: 0, ...over,
});

describe('member condition — memberTypeIds', () => {
  test('ประเภทตรง -> ผ่าน', () => {
    const r = evaluator.evaluate({ type: 'member', params: { memberTypeIds: ['mt-staff'] } },
      ctx({ memberId: 'm1', memberTypeId: 'mt-staff' }));
    expect(r.passed).toBe(true);
  });

  test('ประเภทไม่ตรง -> ไม่ผ่าน', () => {
    const r = evaluator.evaluate({ type: 'member', params: { memberTypeIds: ['mt-staff'] } },
      ctx({ memberId: 'm1', memberTypeId: 'mt-general' }));
    expect(r.passed).toBe(false);
    expect(r.reason).toContain('Member type');
  });

  test('ไม่มีสมาชิก -> ไม่ผ่าน', () => {
    const r = evaluator.evaluate({ type: 'member', params: { memberTypeIds: ['mt-staff'] } }, ctx({}));
    expect(r.passed).toBe(false);
  });

  test('levels + types เป็น AND', () => {
    const cond = { type: 'member', params: { levels: ['gold'], memberTypeIds: ['mt-staff'] } };
    expect(evaluator.evaluate(cond, ctx({ memberId: 'm', memberLevel: 'gold', memberTypeId: 'mt-staff' })).passed).toBe(true);
    expect(evaluator.evaluate(cond, ctx({ memberId: 'm', memberLevel: 'silver', memberTypeId: 'mt-staff' })).passed).toBe(false);
    expect(evaluator.evaluate(cond, ctx({ memberId: 'm', memberLevel: 'gold', memberTypeId: 'mt-general' })).passed).toBe(false);
  });

  test('ไม่กำหนด memberTypeIds -> ไม่ตรวจประเภท (พฤติกรรมเดิม)', () => {
    const r = evaluator.evaluate({ type: 'member', params: { levels: ['gold'] } },
      ctx({ memberId: 'm', memberLevel: 'gold' }));
    expect(r.passed).toBe(true);
  });
});

---
inclusion: always
---

# Design System Rules — POS CRM (Warm Pastel)

ระบบนี้มี Design System กลางอยู่ที่:

- src/constants/colors.ts      → export const Colors, RoleColors, ChartColors, withOpacity()

- src/constants/typography.ts  → export const Typography, FontWeight, FontSize, LineHeight, LetterSpacing

- src/constants/spacing.ts     → export const Spacing, Padding, Margin, BorderRadius, BorderWidth, Shadow,

                                  ComponentSize, Layout, Gap, Duration, Opacity, Container

- src/components/ui/Button.tsx → Button, ButtonGroup, FAB

- src/components/ui/Input.tsx  → Input, Textarea

- src/components/ui/Card.tsx   → Card, CardHeader, CardBody, CardFooter, Badge, Chip, Alert, StatCard

- src/components/ui/Table.tsx  → Table, SummaryRow, TableWithFooter, ExpandableRow

- src/components/ui/index.ts   → barrel export ของทุก component ด้านบน

## กฎที่ต้องทำตามทุกครั้งที่สร้าง/แก้ไขหน้าจอ (.tsx ใน src/screens/**)

1. **ห้าม hardcode** สี / ขนาด font / spacing / border-radius / shadow เด็ดขาด

   - สี       → ใช้ `Colors.*` เท่านั้น (เช่น Colors.primary, Colors.gray8, Colors.danger)

   - ตัวอักษร → ใช้ `Typography.*` (เช่น Typography.headlineMedium, Typography.bodySmall)

   - ระยะห่าง → ใช้ `Spacing.*` (xs=4, sm=8, md=12, lg=16, xl=20, 2xl=24, 3xl=32, 4xl=40, 5xl=48)

   - มุมโค้ง  → ใช้ `BorderRadius.*` (sm=8, md=12, lg=16, full=9999)

   - shadow  → ใช้ `Shadow.*` (none/xs/sm/md/lg/xl)

2. **ใช้ component จาก `@/components/ui` เสมอ** ก่อนเขียน UI พื้นฐานเอง:

   ปุ่ม → `<Button />` หรือ `<FAB />`, ฟอร์ม → `<Input />` / `<Textarea />`,

   กล่อง/การ์ด → `<Card>` + `<CardHeader/Body/Footer>`, ตาราง → `<Table />` / `<TableWithFooter />`,

   สถานะ → `<Badge />` / `<Chip />` / `<Alert />`, ตัวเลข KPI → `<StatCard />`

3. **ห้ามสร้าง component ใหม่ที่ทำหน้าที่ซ้ำกับของเดิม** — ถ้าจำเป็นต้องมี component ใหม่ (เช่น Modal, Select,

   DatePicker, Tabs) ให้สร้างตามแพทเทิร์นเดียวกับ Button/Input (forwardRef, variant/size props,

   ใช้ tokens เดิมทั้งหมด) แล้ววางที่ src/components/ui/ พร้อม export ผ่าน index.ts

4. **Import pattern มาตรฐาน:**

```tsx
   import { Colors } from '@/constants/colors';
   import { Typography } from '@/constants/typography';
   import { Spacing, BorderRadius, Shadow, Container, ComponentSize } from '@/constants/spacing';
   import { Button, Input, Card, Table, Badge, Alert } from '@/components/ui';
```

5. **ข้อความ UI ทั้งหมดเป็นภาษาไทย** (label, placeholder, error message, empty state) ยกเว้น

   ชื่อ component/props/variable ที่เป็นภาษาอังกฤษตามปกติของโค้ด

6. **ทุกหน้าจอต้องมี 3 สถานะนี้เป็นอย่างน้อย:** Loading state, Error state (ใช้ `<Alert type="error" />`),

   Empty state (ไอคอน + ข้อความ "ไม่มีข้อมูล" — ดูแพทเทิร์นใน Table component)

7. **Accessibility:** ปุ่มกด/พื้นที่แตะต้องสูงอย่างน้อย 44px — ใช้ `ComponentSize.button.md` (44) เป็นค่าเริ่มต้น

   ห้ามใช้ size 'xs'/'sm' กับปุ่ม action หลักของหน้าจอ

8. **Layout ต้อง responsive ด้วย flex/gap** ห้ามตั้ง width เป็นตัวเลขตายตัว (fixed px) ยกเว้นกรณี

   icon size / avatar size / คอลัมน์ตารางที่กำหนด width ไว้ใน ColumnDef โดยตั้งใจ

9. **TypeScript เท่านั้น** — ทุก props ต้องมี interface/type ชัดเจน ห้ามใช้ `any` พร่ำเพรื่อ

10. **โครงสร้างไฟล์มาตรฐาน:** หน้าจอใหม่อยู่ที่ `src/screens/<module>/<ScreenName>Screen.tsx`

    ชื่อ component ใช้ PascalCase ลงท้ายด้วย `Screen` (เช่น `LoginScreen`, `ProductListScreen`)

## ตัวอย่างที่ถูกต้อง (Reference Pattern)

```tsx
import React, { useState } from 'react';
import { View, Text, SafeAreaView, ScrollView } from 'react-native';
import { Button, Input, Card, Alert } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Spacing, Container } from '@/constants/spacing';

export const ExampleScreen: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  return (
    <SafeAreaView style={[Container.full, { backgroundColor: Colors.gray0 }]}>
      <ScrollView contentContainerStyle={{ padding: Spacing.lg }}>
        {error && (
          <Alert type="error" title="เกิดข้อผิดพลาด" message={error}
                 onDismiss={() => setError('')} style={{ marginBottom: Spacing.lg }} />
        )}
        <Card>
          <Text style={[Typography.titleMedium, { color: Colors.gray8 }]}>ตัวอย่าง</Text>
        </Card>
        <Button label="บันทึก" fullWidth loading={loading} onPress={() => {}}
                style={{ marginTop: Spacing.lg }} />
      </ScrollView>
    </SafeAreaView>
  );
};
```

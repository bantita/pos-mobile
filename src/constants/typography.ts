/**
 * Design Tokens — Typography
 * Brand: Xcellence ERP · POS Mobile
 * ขนาดตัวอักษร: เพิ่มขึ้น 1 ขั้นจากเดิมทุกระดับ
 */

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const FontSize = {
  micro: 9,
  xxs: 10,
  xs: 11,
  caption: 13,
  sm: 13,
  body: 15,
  bodyLg: 16,
  subtitle: 17,
  subtitleLg: 18,
  title: 20,
  titleLg: 22,
  heading: 26,
  headingLg: 30,
  display: 34,
  displayLg: 42,
};

export const LineHeight = {
  tight: 18,
  normal: 22,
  relaxed: 26,
  loose: 30,
  heading: 34,
  display: 42,
  displayLg: 50,
};

export const Typography = {
  // Headings
  h1: { fontSize: FontSize.heading, fontWeight: FontWeight.bold, lineHeight: LineHeight.heading },
  h2: { fontSize: FontSize.titleLg, fontWeight: FontWeight.bold, lineHeight: LineHeight.loose },
  h3: { fontSize: FontSize.title, fontWeight: FontWeight.semibold, lineHeight: LineHeight.relaxed },
  h4: { fontSize: FontSize.subtitle, fontWeight: FontWeight.semibold, lineHeight: LineHeight.relaxed },

  // Body
  body1: { fontSize: FontSize.body, fontWeight: FontWeight.regular, lineHeight: LineHeight.relaxed },
  body2: { fontSize: FontSize.body, fontWeight: FontWeight.regular, lineHeight: LineHeight.normal },

  // Subtitle
  subtitle1: { fontSize: FontSize.subtitleLg, fontWeight: FontWeight.semibold, lineHeight: LineHeight.relaxed },
  subtitle2: { fontSize: FontSize.subtitle, fontWeight: FontWeight.medium, lineHeight: LineHeight.relaxed },

  // Small / Labels
  caption: { fontSize: FontSize.caption, fontWeight: FontWeight.regular, lineHeight: LineHeight.tight },
  label: { fontSize: FontSize.caption, fontWeight: FontWeight.semibold, lineHeight: LineHeight.tight },
  button: { fontSize: FontSize.body, fontWeight: FontWeight.semibold, lineHeight: LineHeight.normal },

  // Price / KPI
  price: { fontSize: FontSize.titleLg, fontWeight: FontWeight.bold, lineHeight: LineHeight.loose },
  kpiValue: { fontSize: FontSize.heading, fontWeight: FontWeight.extrabold, lineHeight: LineHeight.heading },

  // Display
  displayMedium: { fontSize: FontSize.display, fontWeight: FontWeight.bold, lineHeight: LineHeight.display },
  displaySmall: { fontSize: FontSize.headingLg, fontWeight: FontWeight.bold, lineHeight: LineHeight.display },
};

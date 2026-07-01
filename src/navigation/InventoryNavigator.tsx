/**
 * Inventory Navigator — M05
 * Hub → DocList (receive/issue) → DocForm → DocDetail
 */
import React, { useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StockDocListScreen } from '../screens/inventory/StockDocListScreen';
import { StockDocFormScreen } from '../screens/inventory/StockDocFormScreen';
import { StockDocDetailScreen } from '../screens/inventory/StockDocDetailScreen';
import { StockDocument, DocType } from '../types/stockDocument';
import { useStockDocStore } from '../store/stockDocStore';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { Spacing, BorderRadius } from '../constants/spacing';

export type InvStackParamList = {
  InventoryHub:   undefined;
  DocList:        { docType: DocType };
  DocForm:        { docType: DocType; editDocId?: string };
  DocDetail:      { docId: string };
  // Other M05 screens (placeholders)
  TransferStock:  undefined;
  StockCount:     undefined;
  AdjustStock:    undefined;
  StockInquiry:   undefined;
};

const Stack = createStackNavigator<InvStackParamList>();

// ─── Inventory Hub ────────────────────────────────────────────────────────────
const InventoryHubScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { documents } = useStockDocStore();
  const draftCount = documents.filter(d => d.status === 'draft').length;
  const todayDocs  = documents.filter(d => {
    const today = new Date(); const dc = new Date(d.createdAt);
    return dc.toDateString() === today.toDateString();
  }).length;

  const MENUS = [
    {
      icon: 'arrow-down-circle-outline', label: 'รับสินค้า', sub: 'Receive',
      color: Colors.success, bgColor: Colors.successLight,
      badge: documents.filter(d => d.docType === 'receive' && d.status === 'draft').length,
      onPress: () => navigation.navigate('DocList', { docType: 'receive' }),
    },
    {
      icon: 'arrow-up-circle-outline', label: 'เบิกสินค้า', sub: 'Issue',
      color: Colors.info, bgColor: Colors.infoLight,
      badge: documents.filter(d => d.docType === 'issue' && d.status === 'draft').length,
      onPress: () => navigation.navigate('DocList', { docType: 'issue' }),
    },
    {
      icon: 'swap-horizontal-outline', label: 'โอนสินค้า', sub: 'Transfer',
      color: Colors.primary, bgColor: Colors.primaryLight,
      badge: 0, onPress: () => navigation.navigate('TransferStock'),
    },
    {
      icon: 'scan-outline', label: 'นับสต๊อก', sub: 'Count',
      color: Colors.warning, bgColor: Colors.warningLight,
      badge: 0, onPress: () => navigation.navigate('StockCount'),
    },
    {
      icon: 'create-outline', label: 'ปรับสต๊อก', sub: 'Adjust',
      color: Colors.danger, bgColor: Colors.dangerLight,
      badge: 0, onPress: () => navigation.navigate('AdjustStock'),
    },
    {
      icon: 'search-outline', label: 'ตรวจสอบคงเหลือ', sub: 'Inquiry',
      color: Colors.gray600, bgColor: Colors.gray100,
      badge: 0, onPress: () => navigation.navigate('StockInquiry'),
    },
  ];

  return (
    <SafeAreaView style={hubStyles.container} edges={['top']}>
      <View style={hubStyles.header}>
        <Text style={hubStyles.headerTitle}>คลังสินค้า</Text>
        <Text style={hubStyles.headerSub}>Inventory Management</Text>
      </View>

      <ScrollView contentContainerStyle={hubStyles.scroll} showsVerticalScrollIndicator={false}>
        {/* Quick stats */}
        <View style={hubStyles.statsRow}>
          {[
            { label: 'เอกสารวันนี้', value: String(todayDocs), icon: 'document-text-outline', color: Colors.primary },
            { label: 'แบบร่างค้างอยู่', value: String(draftCount), icon: 'time-outline', color: draftCount > 0 ? Colors.warning : Colors.success },
            { label: 'เอกสารทั้งหมด', value: String(documents.length), icon: 'archive-outline', color: Colors.text },
          ].map((s, i) => (
            <View key={i} style={hubStyles.statCard}>
              <Ionicons name={s.icon as any} size={20} color={s.color} />
              <Text style={[hubStyles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={hubStyles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Menu Grid */}
        <Text style={hubStyles.menuLabel}>เมนูคลังสินค้า</Text>
        <View style={hubStyles.menuGrid}>
          {MENUS.map((m, i) => (
            <TouchableOpacity key={i} style={[hubStyles.menuCard, { borderTopColor: m.color }]} onPress={m.onPress} activeOpacity={0.8}>
              {m.badge > 0 && (
                <View style={hubStyles.badge}>
                  <Text style={hubStyles.badgeText}>{m.badge}</Text>
                </View>
              )}
              <View style={[hubStyles.menuIcon, { backgroundColor: m.bgColor }]}>
                <Ionicons name={m.icon as any} size={26} color={m.color} />
              </View>
              <Text style={hubStyles.menuLabel2}>{m.label}</Text>
              <Text style={hubStyles.menuSub}>{m.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent docs */}
        {documents.length > 0 && (
          <>
            <Text style={hubStyles.recentLabel}>เอกสารล่าสุด</Text>
            <View style={hubStyles.recentList}>
              {documents.slice(0, 3).map((d) => (
                <TouchableOpacity
                  key={d.id}
                  style={hubStyles.recentCard}
                  onPress={() => navigation.navigate('DocDetail', { docId: d.id })}
                >
                  <View style={[hubStyles.recentIcon, { backgroundColor: d.docType === 'receive' ? Colors.successLight : Colors.infoLight }]}>
                    <Ionicons
                      name={d.docType === 'receive' ? 'arrow-down-circle-outline' : 'arrow-up-circle-outline'}
                      size={18}
                      color={d.docType === 'receive' ? Colors.success : Colors.info}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={hubStyles.recentDocNo}>{d.docNo}</Text>
                    <Text style={hubStyles.recentMeta}>{d.warehouseName} · {d.totalItems} รายการ</Text>
                  </View>
                  <View style={[hubStyles.recentStatus, {
                    backgroundColor: d.status === 'confirmed' ? Colors.successLight : d.status === 'draft' ? Colors.warningLight : Colors.dangerLight
                  }]}>
                    <Text style={[hubStyles.recentStatusText, {
                      color: d.status === 'confirmed' ? Colors.success : d.status === 'draft' ? Colors.warning : Colors.danger
                    }]}>
                      {d.status === 'confirmed' ? 'ยืนยัน' : d.status === 'draft' ? 'แบบร่าง' : 'ยกเลิก'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const hubStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.lg },
  headerTitle: { ...Typography.h3, color: Colors.white },
  headerSub: { ...Typography.body2, color: 'rgba(255,255,255,0.7)' },
  scroll: { padding: Spacing.md, gap: Spacing.md },
  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  statCard: { flex: 1, backgroundColor: Colors.white, borderRadius: BorderRadius.md, padding: Spacing.md, alignItems: 'center', gap: 4, shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  statValue: { fontSize: 26, fontWeight: '800' },
  statLabel: { ...Typography.caption, color: Colors.textSecondary, textAlign: 'center' },
  menuLabel: { ...Typography.label, color: Colors.gray600 },
  menuGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  menuCard: { width: '30.5%', flexGrow: 1, backgroundColor: Colors.white, borderRadius: BorderRadius.md, padding: Spacing.md, alignItems: 'center', gap: Spacing.xs, borderTopWidth: 3, position: 'relative', shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  badge: { position: 'absolute', top: 6, right: 6, backgroundColor: Colors.danger, borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeText: { fontSize: 13, color: Colors.white, fontWeight: '800' },
  menuIcon: { width: 48, height: 48, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  menuLabel2: { ...Typography.label, color: Colors.text, textAlign: 'center', fontSize: 16 },
  menuSub: { ...Typography.caption, color: Colors.textSecondary, fontSize: 14 },
  recentLabel: { ...Typography.label, color: Colors.gray600 },
  recentList: { gap: Spacing.sm },
  recentCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.white, borderRadius: BorderRadius.md, padding: Spacing.md, shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  recentIcon: { width: 36, height: 36, borderRadius: BorderRadius.sm, alignItems: 'center', justifyContent: 'center' },
  recentDocNo: { ...Typography.label, color: Colors.text },
  recentMeta: { ...Typography.caption, color: Colors.textSecondary },
  recentStatus: { borderRadius: BorderRadius.sm, paddingHorizontal: 7, paddingVertical: 3 },
  recentStatusText: { fontSize: 14, fontWeight: '700' },
});

// ─── Placeholder ──────────────────────────────────────────────────────────────
const PlaceholderScreen: React.FC<{ title: string; icon: string; color: string; onBack: () => void }> = ({ title, icon, color, onBack }) => (
  <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }} edges={['top']}>
    <View style={{ backgroundColor: color, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md }}>
      <TouchableOpacity onPress={onBack} style={{ padding: 4 }}>
        <Ionicons name="arrow-back" size={24} color={Colors.white} />
      </TouchableOpacity>
      <Text style={{ ...Typography.h4, color: Colors.white }}>{title}</Text>
    </View>
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <Ionicons name={icon as any} size={64} color={color} />
      <Text style={{ ...Typography.h3, color: Colors.text }}>{title}</Text>
      <Text style={{ ...Typography.body2, color: Colors.textSecondary }}>กำลังพัฒนา...</Text>
    </View>
  </SafeAreaView>
);

// ─── Navigator ────────────────────────────────────────────────────────────────
export const InventoryNavigator: React.FC = () => {
  const { getDocById } = useStockDocStore();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="InventoryHub" component={InventoryHubScreen} />

      <Stack.Screen name="DocList">
        {({ navigation, route }) => {
          const { docType } = route.params;
          return (
            <StockDocListScreen
              docType={docType}
              onBack={() => navigation.goBack()}
              onCreateNew={() => navigation.navigate('DocForm', { docType })}
              onOpenDoc={(doc) => navigation.navigate('DocDetail', { docId: doc.id })}
            />
          );
        }}
      </Stack.Screen>

      <Stack.Screen name="DocForm">
        {({ navigation, route }) => {
          const { docType, editDocId } = route.params;
          return (
            <StockDocFormScreen
              docType={docType}
              editDocId={editDocId}
              onBack={() => navigation.goBack()}
              onSaved={(doc) => navigation.replace('DocDetail', { docId: doc.id })}
            />
          );
        }}
      </Stack.Screen>

      <Stack.Screen name="DocDetail">
        {({ navigation, route }) => {
          const doc = getDocById(route.params.docId);
          if (!doc) return null;
          return (
            <StockDocDetailScreen
              doc={doc}
              onBack={() => navigation.goBack()}
              onEdit={() => navigation.replace('DocForm', { docType: doc.docType, editDocId: doc.id })}
              onOpenDoc={(docId) => navigation.replace('DocDetail', { docId })}
            />
          );
        }}
      </Stack.Screen>

      <Stack.Screen name="TransferStock">
        {({ navigation }) => <PlaceholderScreen title="โอนสินค้า" icon="swap-horizontal-outline" color={Colors.primary} onBack={() => navigation.goBack()} />}
      </Stack.Screen>
      <Stack.Screen name="StockCount">
        {({ navigation }) => <PlaceholderScreen title="นับสต๊อก" icon="scan-outline" color={Colors.warning} onBack={() => navigation.goBack()} />}
      </Stack.Screen>
      <Stack.Screen name="AdjustStock">
        {({ navigation }) => <PlaceholderScreen title="ปรับสต๊อก" icon="create-outline" color={Colors.danger} onBack={() => navigation.goBack()} />}
      </Stack.Screen>
      <Stack.Screen name="StockInquiry">
        {({ navigation }) => <PlaceholderScreen title="ตรวจสอบคงเหลือ" icon="search-outline" color={Colors.gray600} onBack={() => navigation.goBack()} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

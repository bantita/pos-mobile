/**
 * Inventory Navigator — M05
 * Hub → DocList (receive/issue) → DocForm → DocDetail
 */
import React from 'react';
import { createStackNavigator } from "expo-router/build/react-navigation/stack";
import { View, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { StockDocListScreen } from '@/features/inventory/presentation/screens/StockDocListScreen';
import { StockDocFormScreen } from '@/features/inventory/presentation/screens/StockDocFormScreen';
import { StockDocDetailScreen } from '@/features/inventory/presentation/screens/StockDocDetailScreen';
import { StockDocument, DocType } from '@/features/inventory/domain/stockDocument';
import { useStockDocStore } from '@/features/inventory/application/stores/stockDocStore';
import { MOCK_SUPPLIERS, MOCK_WAREHOUSES } from '@/features/inventory/data/mocks/mockInventory';
import { MOCK_PRODUCTS } from '@/features/product/data/mocks/mockProducts';
import { cn } from '@/shared/lib/cn';
import { Text } from '@/shared/tw/index';
import { ScreenSurface } from '@/shared/ui/index';

export type InvStackParamList = {
  InventoryHub:   undefined;
  DocList:        { docType: DocType };
  DocForm:        { docType: DocType; editDocId?: string };
  DocDetail:      { docId: string };
  TransferStock:  undefined;
  StockCount:     undefined;
  AdjustStock:    undefined;
  StockInquiry:   undefined;
};

const Stack = createStackNavigator<InvStackParamList>();

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
      color: '#16a34a', bgColor: '#d1fae5',
      badge: documents.filter(d => d.docType === 'receive' && d.status === 'draft').length,
      onPress: () => navigation.navigate('DocList', { docType: 'receive' }),
    },
    {
      icon: 'arrow-up-circle-outline', label: 'เบิกสินค้า', sub: 'Issue',
      color: '#3b82f6', bgColor: '#eef2ff',
      badge: documents.filter(d => d.docType === 'issue' && d.status === 'draft').length,
      onPress: () => navigation.navigate('DocList', { docType: 'issue' }),
    },
    {
      icon: 'swap-horizontal-outline', label: 'โอนสินค้า', sub: 'Transfer',
      color: '#1e40af', bgColor: '#eef2ff',
      badge: 0, onPress: () => navigation.navigate('TransferStock'),
    },
    {
      icon: 'scan-outline', label: 'นับสต๊อก', sub: 'Count',
      color: '#facc15', bgColor: '#fef3c7',
      badge: 0, onPress: () => navigation.navigate('StockCount'),
    },
    {
      icon: 'create-outline', label: 'ปรับสต๊อก', sub: 'Adjust',
      color: '#ef4444', bgColor: '#ffe4e6',
      badge: 0, onPress: () => navigation.navigate('AdjustStock'),
    },
    {
      icon: 'search-outline', label: 'ตรวจสอบคงเหลือ', sub: 'Inquiry',
      color: '#78716c', bgColor: '#f3f4f6',
      badge: 0, onPress: () => navigation.navigate('StockInquiry'),
    },
  ];

  return (
    <SafeAreaView className={cn('flex-1 bg-[#f6f7fb]')} edges={['top']}>
      <View className={cn('bg-slate-950 px-6 py-6')}>
        <Text className={cn('text-xl font-bold text-white')}>คลังสินค้า</Text>
        <Text className={cn('text-sm text-white/70')}>Inventory Management</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} showsVerticalScrollIndicator={false}>
        <View className={cn('flex-row gap-2')}>
          {[
            { label: 'เอกสารวันนี้', value: String(todayDocs), icon: 'document-text-outline', color: '#1e40af' },
            { label: 'แบบร่างค้างอยู่', value: String(draftCount), icon: 'time-outline', color: draftCount > 0 ? '#facc15' : '#16a34a' },
            { label: 'เอกสารทั้งหมด', value: String(documents.length), icon: 'archive-outline', color: '#27272a' },
          ].map((s, i) => (
            <View key={i} className={cn('flex-1 bg-white rounded-lg p-4 items-center gap-1 shadow-sm')} style={{ boxShadow: '0 4px 14px rgba(15, 23, 42, 0.07)' }}>
              <Ionicons name={s.icon as any} size={20} color={s.color} />
              <Text className="text-2xl font-extrabold" style={{ color: s.color }}>{s.value}</Text>
              <Text className={cn('text-xs text-neutral-500 text-center')}>{s.label}</Text>
            </View>
          ))}
        </View>

        <Text className={cn('text-sm font-semibold text-neutral-500')}>เมนูคลังสินค้า</Text>
        <View className={cn('flex-row flex-wrap gap-2')}>
          {MENUS.map((m, i) => (
            <TouchableOpacity
              key={i}
              className={cn('w-[30.5%] flex-grow bg-white rounded-lg p-4 items-center gap-1 relative shadow-sm')}
              style={{ borderTopWidth: 3, borderTopColor: m.color, boxShadow: '0 4px 14px rgba(15, 23, 42, 0.07)' }}
              onPress={m.onPress}
              activeOpacity={0.8}
            >
              {m.badge > 0 && (
                <View className={cn('absolute top-1.5 right-1.5 bg-red-600 rounded-full min-w-[16px] h-4 items-center justify-center px-1')}>
                  <Text className={cn('text-xs text-white font-extrabold')}>{m.badge}</Text>
                </View>
              )}
              <View className={cn('w-12 h-12 rounded-lg items-center justify-center')} style={{ backgroundColor: m.bgColor }}>
                <Ionicons name={m.icon as any} size={26} color={m.color} />
              </View>
              <Text className={cn('text-sm font-semibold text-neutral-800 text-center text-base')}>{m.label}</Text>
              <Text className={cn('text-xs text-neutral-500 text-center text-sm')}>{m.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {documents.length > 0 && (
          <>
            <Text className={cn('text-sm font-semibold text-neutral-500')}>เอกสารล่าสุด</Text>
            <View className={cn('gap-2')}>
              {documents.slice(0, 3).map((d) => (
                <TouchableOpacity
                  key={d.id}
                  className={cn('flex-row items-center gap-2 bg-white rounded-lg p-4 shadow-sm')}
                  style={{ boxShadow: '0 1px 3px rgba(15, 23, 42, 0.06)' }}
                  onPress={() => navigation.navigate('DocDetail', { docId: d.id })}
                >
                  <View
                    className={cn('w-9 h-9 rounded items-center justify-center')}
                    style={{ backgroundColor: d.docType === 'receive' ? '#d1fae5' : '#eef2ff' }}
                  >
                    <Ionicons
                      name={d.docType === 'receive' ? 'arrow-down-circle-outline' : 'arrow-up-circle-outline'}
                      size={18}
                      color={d.docType === 'receive' ? '#16a34a' : '#3b82f6'}
                    />
                  </View>
                  <View className={cn('flex-1')}>
                    <Text className={cn('text-sm font-semibold text-neutral-800')}>{d.docNo}</Text>
                    <Text className={cn('text-xs text-neutral-500')}>{d.warehouseName} · {d.totalItems} รายการ</Text>
                  </View>
                  <View
                    className={cn('rounded px-2 py-1')}
                    style={{
                      backgroundColor: d.status === 'confirmed' ? '#d1fae5' : d.status === 'draft' ? '#fef3c7' : '#ffe4e6'
                    }}
                  >
                    <Text
                      style={{
                        color: d.status === 'confirmed' ? '#16a34a' : d.status === 'draft' ? '#facc15' : '#ef4444'
                      }}
                      className={cn('text-sm font-bold')}
                    >
                      {d.status === 'confirmed' ? 'ยืนยัน' : d.status === 'draft' ? 'แบบร่าง' : 'ยกเลิก'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const PlaceholderScreen: React.FC<{ title: string; icon: string; color: string; onBack: () => void }> = ({ title, icon, color, onBack }) => (
  <SafeAreaView className={cn('flex-1 bg-[#f6f7fb]')} edges={['top']}>
    <View className={cn('flex-row items-center gap-2 p-4')} style={{ backgroundColor: color }}>
      <TouchableOpacity onPress={onBack} className={cn('p-1')}>
        <Ionicons name="arrow-back" size={24} color="#fafafa" />
      </TouchableOpacity>
      <Text className={cn('text-lg font-bold text-white')}>{title}</Text>
    </View>
    <View className={cn('flex-1 items-center justify-center gap-4')}>
      <Ionicons name={icon as any} size={64} color={color} />
      <Text className={cn('text-xl font-bold text-neutral-800')}>{title}</Text>
      <Text className={cn('text-sm text-neutral-500')}>กำลังพัฒนา...</Text>
    </View>
  </SafeAreaView>
);

export const InventoryNavigator: React.FC = () => {
  const { addDocument, updateDocument, cancelDocument, getDocById } = useStockDocStore();

  return (
    <Stack.Navigator screenLayout={({ children }) => <ScreenSurface>{children}</ScreenSurface>} screenOptions={{ headerShown: false }}>
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
          const existingDoc = editDocId ? getDocById(editDocId) : null;

          const saveDoc = (doc: StockDocument) => {
            if (editDocId) {
              updateDocument(editDocId, doc);
              navigation.replace('DocDetail', { docId: editDocId });
              return;
            }

            const saved = addDocument(doc);
            navigation.replace('DocDetail', { docId: saved.id });
          };

          return (
            <StockDocFormScreen
              docType={docType}
              existingDoc={existingDoc}
              allProducts={MOCK_PRODUCTS}
              warehouses={MOCK_WAREHOUSES}
              suppliers={MOCK_SUPPLIERS}
              onSave={saveDoc}
              onConfirmSave={saveDoc}
              onBack={() => navigation.goBack()}
              onAddProduct={() => undefined}
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
              allProducts={MOCK_PRODUCTS}
              onBack={() => navigation.goBack()}
              onEdit={() => navigation.replace('DocForm', { docType: doc.docType, editDocId: doc.id })}
              onCancel={(docId) => cancelDocument(docId)}
            />
          );
        }}
      </Stack.Screen>

      <Stack.Screen name="TransferStock">
        {({ navigation }) => <PlaceholderScreen title="โอนสินค้า" icon="swap-horizontal-outline" color="#1e40af" onBack={() => navigation.goBack()} />}
      </Stack.Screen>
      <Stack.Screen name="StockCount">
        {({ navigation }) => <PlaceholderScreen title="นับสต๊อก" icon="scan-outline" color="#facc15" onBack={() => navigation.goBack()} />}
      </Stack.Screen>
      <Stack.Screen name="AdjustStock">
        {({ navigation }) => <PlaceholderScreen title="ปรับสต๊อก" icon="create-outline" color="#ef4444" onBack={() => navigation.goBack()} />}
      </Stack.Screen>
      <Stack.Screen name="StockInquiry">
        {({ navigation }) => <PlaceholderScreen title="ตรวจสอบคงเหลือ" icon="search-outline" color="#78716c" onBack={() => navigation.goBack()} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

/**
 * WebErpSettingsScreen — ตั้งค่าการเชื่อมต่อ ERP (mock)
 * ทดสอบการเชื่อมต่อ + sync สินค้า/ยอดขาย แบบจำลอง (gated ด้วย MOCK_ERP)
 */
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebColors } from '../../constants/webColors';
import { Colors } from '../../design-system/tokens';
import { useErpStore, ErpSyncKind } from '../../store/erpStore';
import { FEATURE_FLAGS } from '../../config/featureFlags';

interface WebErpSettingsScreenProps {
  onBack: () => void;
}

const inputStyle = {
  borderWidth: 1,
  borderColor: WebColors.border,
  borderRadius: 8,
  paddingHorizontal: 12,
  paddingVertical: 10,
  fontSize: 12,
  color: WebColors.text,
} as const;

const labelStyle = { fontSize: 11, fontWeight: '600' as const, color: WebColors.textSecondary, marginBottom: 4 };

export const WebErpSettingsScreen: React.FC<WebErpSettingsScreenProps> = ({ onBack }) => {
  const {
    endpoint, apiKey, companyCode, connectionStatus, lastError, lastSyncResult,
    setEndpoint, setApiKey, setCompanyCode, testConnection, runSync,
  } = useErpStore();

  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState<ErpSyncKind | null>(null);

  const handleTest = async () => {
    setTesting(true);
    await testConnection();
    setTesting(false);
  };

  const handleSync = async (kind: ErpSyncKind) => {
    setSyncing(kind);
    await runSync(kind);
    setSyncing(null);
  };

  const statusMeta = {
    idle: { label: 'ยังไม่ได้เชื่อมต่อ', color: WebColors.textSecondary, bg: WebColors.gray100, icon: 'ellipse-outline' as const },
    testing: { label: 'กำลังทดสอบ...', color: WebColors.warning, bg: WebColors.warningLight, icon: 'time-outline' as const },
    connected: { label: 'เชื่อมต่อสำเร็จ', color: WebColors.success, bg: WebColors.successLight, icon: 'checkmark-circle' as const },
    error: { label: 'เชื่อมต่อไม่สำเร็จ', color: WebColors.danger, bg: WebColors.dangerLight, icon: 'close-circle' as const },
  }[connectionStatus];

  const isConnected = connectionStatus === 'connected';

  return (
    <View style={{ flex: 1, padding: 24 }}>
      <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }} onPress={onBack}>
        <Ionicons name="arrow-back" size={18} color={WebColors.primary} />
        <Text style={{ fontSize: 12, color: WebColors.primary, fontWeight: '600' }}>ตั้งค่า</Text>
      </TouchableOpacity>
      <Text style={{ fontSize: 20, fontWeight: '700', color: WebColors.text }}>ERP Integration</Text>
      <Text style={{ fontSize: 13, color: WebColors.textSecondary, marginTop: 2 }}>
        เชื่อมต่อระบบ ERP หลังบ้าน (สต๊อก / บัญชี) — ซิงก์ข้อมูลสินค้าและยอดขาย
      </Text>

      {FEATURE_FLAGS.MOCK_ERP && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, backgroundColor: WebColors.warningLight, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 }}>
          <Ionicons name="flask-outline" size={14} color={WebColors.warning} />
          <Text style={{ fontSize: 11, color: WebColors.warning }}>โหมดจำลอง (mock) — ยังไม่เชื่อมต่อ ERP จริง</Text>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingVertical: 16 }}>
        {/* การตั้งค่าการเชื่อมต่อ */}
        <View style={{ backgroundColor: WebColors.white, borderRadius: 12, padding: 20, borderWidth: 1, borderColor: WebColors.border, gap: 12 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: WebColors.text }}>ข้อมูลการเชื่อมต่อ</Text>

          <View>
            <Text style={labelStyle}>Endpoint (URL) *</Text>
            <TextInput
              style={inputStyle}
              value={endpoint}
              onChangeText={setEndpoint}
              placeholder="เช่น https://erp.example.com/api"
              placeholderTextColor={WebColors.textDisabled}
              autoCapitalize="none"
            />
          </View>

          <View>
            <Text style={labelStyle}>API Key *</Text>
            <TextInput
              style={inputStyle}
              value={apiKey}
              onChangeText={setApiKey}
              placeholder="กรอก API Key ที่ได้จากระบบ ERP"
              placeholderTextColor={WebColors.textDisabled}
              secureTextEntry
            />
          </View>

          <View>
            <Text style={labelStyle}>รหัสบริษัท (Company Code)</Text>
            <TextInput
              style={inputStyle}
              value={companyCode}
              onChangeText={setCompanyCode}
              placeholder="เช่น COMP-001"
              placeholderTextColor={WebColors.textDisabled}
            />
          </View>

          {/* สถานะการเชื่อมต่อ */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: statusMeta.bg, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, alignSelf: 'flex-start' }}>
            {connectionStatus === 'testing'
              ? <ActivityIndicator size="small" color={statusMeta.color} />
              : <Ionicons name={statusMeta.icon} size={14} color={statusMeta.color} />}
            <Text style={{ fontSize: 12, fontWeight: '600', color: statusMeta.color }}>{statusMeta.label}</Text>
          </View>

          {/* Error state */}
          {lastError ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: WebColors.dangerLight, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 }}>
              <Ionicons name="alert-circle" size={14} color={WebColors.danger} />
              <Text style={{ fontSize: 11, color: WebColors.danger }}>{lastError}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: WebColors.primary, borderRadius: 8, paddingVertical: 12, alignSelf: 'flex-start', paddingHorizontal: 20, opacity: testing ? 0.6 : 1 }}
            onPress={handleTest}
            disabled={testing}
          >
            {testing
              ? <ActivityIndicator size="small" color={WebColors.white} />
              : <Ionicons name="pulse-outline" size={16} color={WebColors.white} />}
            <Text style={{ fontSize: 12, fontWeight: '700', color: WebColors.white }}>ทดสอบการเชื่อมต่อ</Text>
          </TouchableOpacity>
        </View>

        {/* การซิงก์ข้อมูล */}
        <View style={{ backgroundColor: WebColors.white, borderRadius: 12, padding: 20, borderWidth: 1, borderColor: WebColors.border, gap: 12 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: WebColors.text }}>ซิงก์ข้อมูล</Text>

          {!isConnected ? (
            /* Empty state — ต้องเชื่อมต่อก่อน */
            <View style={{ alignItems: 'center', gap: 8, paddingVertical: 24 }}>
              <Ionicons name="cloud-offline-outline" size={36} color={WebColors.textDisabled} />
              <Text style={{ fontSize: 12, color: WebColors.textSecondary }}>กรุณาทดสอบการเชื่อมต่อให้สำเร็จก่อนเริ่มซิงก์ข้อมูล</Text>
            </View>
          ) : (
            <>
              <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: WebColors.successLight, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 16, opacity: syncing === 'product' ? 0.6 : 1 }}
                  onPress={() => handleSync('product')}
                  disabled={syncing !== null}
                >
                  {syncing === 'product'
                    ? <ActivityIndicator size="small" color={WebColors.success} />
                    : <Ionicons name="cube-outline" size={16} color={WebColors.success} />}
                  <Text style={{ fontSize: 12, fontWeight: '700', color: WebColors.success }}>ซิงก์สินค้า</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: WebColors.infoLight, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 16, opacity: syncing === 'sales' ? 0.6 : 1 }}
                  onPress={() => handleSync('sales')}
                  disabled={syncing !== null}
                >
                  {syncing === 'sales'
                    ? <ActivityIndicator size="small" color={WebColors.info} />
                    : <Ionicons name="trending-up-outline" size={16} color={WebColors.info} />}
                  <Text style={{ fontSize: 12, fontWeight: '700', color: WebColors.info }}>ซิงก์ยอดขาย</Text>
                </TouchableOpacity>
              </View>

              {/* ผลการ sync ล่าสุด */}
              {lastSyncResult ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: lastSyncResult.success ? WebColors.successLight : WebColors.dangerLight, borderRadius: 8, padding: 12 }}>
                  <Ionicons name={lastSyncResult.success ? 'checkmark-circle' : 'close-circle'} size={16} color={lastSyncResult.success ? WebColors.success : WebColors.danger} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: lastSyncResult.success ? WebColors.success : WebColors.danger }}>{lastSyncResult.message}</Text>
                    <Text style={{ fontSize: 10, color: WebColors.textSecondary }}>
                      เมื่อ {new Date(lastSyncResult.syncedAt).toLocaleString('th-TH')}
                    </Text>
                  </View>
                </View>
              ) : (
                <Text style={{ fontSize: 11, color: Colors.textSecondary }}>ยังไม่มีการซิงก์ข้อมูล</Text>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

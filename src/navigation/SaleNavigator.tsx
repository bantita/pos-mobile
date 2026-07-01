/**
 * Sale Navigator — M03
 * Normal mode → POSSaleScreen
 * Kiosk mode  → KioskPOSSaleScreen (fullscreen, PIN to exit)
 */
import React, { useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { POSSaleScreen }          from '../screens/sale/POSSaleScreen';
import { KioskPOSSaleScreen }     from '../screens/kiosk/KioskPOSSaleScreen';
import { BarcodeScannerScreen }   from '../screens/sale/BarcodeScannerScreen';
import { CartScreen }             from '../screens/sale/CartScreen';
import { DiscountScreen }         from '../screens/sale/DiscountScreen';
import { HoldBillScreen }         from '../screens/sale/HoldBillScreen';
import { PaymentScreen }          from '../screens/sale/PaymentScreen';
import { ReceiptScreen }          from '../screens/sale/ReceiptScreen';
import { CustomerDisplayScreen }  from '../screens/sale/CustomerDisplayScreen';
import { AdManagerScreen }         from '../screens/sale/AdManagerScreen';
import { CancelBillScreen }       from '../screens/sale/CancelBillScreen';
import { ShiftScreen }            from '../screens/sale/ShiftScreen';
import { KioskSetupScreen }       from '../screens/kiosk/KioskSetupScreen';
import { useKioskStore }          from '../store/kioskStore';
import { Payment } from '../types/sale';

export type SaleStackParamList = {
  POSSale:         undefined;
  KioskSetup:      undefined;
  BarcodeScanner:  undefined;
  Cart:            undefined;
  Discount:        undefined;
  HoldBill:        undefined;
  Payment:         undefined;
  Receipt:         { saleNo: string; payments: Payment[] };
  CustomerDisplay: { mode?: string };
  AdManager:       undefined;
  CancelBill:      { saleNo?: string };
  Shift:           undefined;
};

const Stack = createStackNavigator<SaleStackParamList>();

/** หน้าขายหลัก — สลับ normal / kiosk อัตโนมัติ */
const SaleEntryScreen: React.FC<{
  onOpenCart:            () => void;
  onOpenScanner:         () => void;
  onOpenHoldBill:        () => void;
  onOpenCustomerDisplay: () => void;
  onCancelBill:          () => void;
  onOpenKioskSetup:      () => void;
  onExitKiosk:           () => void;
}> = (props) => {
  const { isKioskMode } = useKioskStore();

  if (isKioskMode) {
    return (
      <KioskPOSSaleScreen
        onOpenCart={props.onOpenCart}
        onExitKiosk={props.onExitKiosk}
      />
    );
  }

  return (
    <POSSaleScreen
      onOpenCart={props.onOpenCart}
      onOpenScanner={props.onOpenScanner}
      onOpenHoldBill={props.onOpenHoldBill}
      onOpenCustomerDisplay={props.onOpenCustomerDisplay}
      onCancelBill={props.onCancelBill}
    />
  );
};

export const SaleNavigator: React.FC = () => {
  const [lastPayments, setLastPayments] = useState<Payment[]>([]);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>

      {/* ── หน้าขายหลัก (normal / kiosk) ── */}
      <Stack.Screen name="POSSale">
        {(props) => (
          <SaleEntryScreen
            onOpenCart={()              => props.navigation.navigate('Cart')}
            onOpenScanner={()           => props.navigation.navigate('BarcodeScanner')}
            onOpenHoldBill={()          => props.navigation.navigate('HoldBill')}
            onOpenCustomerDisplay={()   => props.navigation.navigate('CustomerDisplay')}
            onCancelBill={()            => props.navigation.navigate('CancelBill', {})}
            onOpenKioskSetup={()        => props.navigation.navigate('KioskSetup')}
            onExitKiosk={()             => props.navigation.navigate('POSSale')}
          />
        )}
      </Stack.Screen>

      {/* ── ตั้งค่า Kiosk (modal) ── */}
      <Stack.Screen
        name="KioskSetup"
        options={{ presentation: 'modal', gestureEnabled: false }}
      >
        {(props) => (
          <KioskSetupScreen
            onStart={()  => props.navigation.navigate('POSSale')}
            onCancel={()  => props.navigation.goBack()}
          />
        )}
      </Stack.Screen>

      {/* ── Barcode Scanner ── */}
      <Stack.Screen name="BarcodeScanner">
        {(props) => (
          <BarcodeScannerScreen
            onBack={()         => props.navigation.goBack()}
            onProductFound={()  => props.navigation.goBack()}
          />
        )}
      </Stack.Screen>

      {/* ── Cart ── */}
      <Stack.Screen name="Cart">
        {(props) => (
          <CartScreen
            onBack={()            => props.navigation.goBack()}
            onCheckout={()        => props.navigation.navigate('Payment')}
            onDiscount={()        => props.navigation.navigate('Discount')}
            onCancelBill={()      => props.navigation.navigate('CancelBill', {})}
            onCustomerDisplay={()  => props.navigation.navigate('CustomerDisplay')}
          />
        )}
      </Stack.Screen>

      {/* ── Discount ── */}
      <Stack.Screen name="Discount">
        {(props) => (
          <DiscountScreen
            onBack={()     => props.navigation.goBack()}
            onApplied={()   => props.navigation.navigate('Cart')}
          />
        )}
      </Stack.Screen>

      {/* ── Hold Bill ── */}
      <Stack.Screen name="HoldBill">
        {(props) => (
          <HoldBillScreen
            onBack={()      => props.navigation.goBack()}
            onRecalled={()   => props.navigation.navigate('POSSale')}
          />
        )}
      </Stack.Screen>

      {/* ── Payment ── */}
      <Stack.Screen name="Payment">
        {(props) => (
          <PaymentScreen
            onBack={() => props.navigation.goBack()}
            onPaid={(payments, saleNo) => {
              setLastPayments(payments);
              props.navigation.navigate('Receipt', { saleNo, payments });
            }}
          />
        )}
      </Stack.Screen>

      {/* ── Receipt ── */}
      <Stack.Screen name="Receipt">
        {(props) => (
          <ReceiptScreen
            saleNo={props.route.params.saleNo}
            payments={props.route.params.payments}
            onNewSale={() => props.navigation.navigate('POSSale')}
          />
        )}
      </Stack.Screen>

      {/* ── Customer Display (modal) ── */}
      <Stack.Screen name="CustomerDisplay" options={{ presentation: 'modal' }}>
        {(props) => (
          <CustomerDisplayScreen
            mode={(props.route.params?.mode as any) ?? 'cart'}
          />
        )}
      </Stack.Screen>

      {/* ── Ad Manager (modal) ── */}
      <Stack.Screen name="AdManager" options={{ presentation: 'modal' }}>
        {(props) => (
          <AdManagerScreen onBack={() => props.navigation.goBack()} />
        )}
      </Stack.Screen>

      {/* ── Cancel Bill (modal) ── */}
      <Stack.Screen name="CancelBill" options={{ presentation: 'modal' }}>
        {(props) => (
          <CancelBillScreen
            saleNo={props.route.params?.saleNo}
            onBack={()      => props.navigation.goBack()}
            onCancelled={()  => props.navigation.navigate('POSSale')}
          />
        )}
      </Stack.Screen>

      {/* ── Shift (modal) ── */}
      <Stack.Screen name="Shift" options={{ presentation: 'modal' }}>
        {(props) => (
          <ShiftScreen onBack={() => props.navigation.goBack()} />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

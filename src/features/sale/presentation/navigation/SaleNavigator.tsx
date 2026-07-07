import React from 'react';
import { createStackNavigator } from 'expo-router/build/react-navigation/stack';
import { PosSaleScreen } from '@/features/sale/presentation/screens/POSSaleScreen';
import { CartScreen } from '@/features/sale/presentation/screens/CartScreen';
import { PaymentScreen } from '@/features/sale/presentation/screens/PaymentScreen';
import { DiscountScreen } from '@/features/sale/presentation/screens/DiscountScreen';
import { ReceiptScreen } from '@/features/sale/presentation/screens/ReceiptScreen';
import { KioskSetupScreen } from '@/features/kiosk/presentation/screens/KioskSetupScreen';
import { KioskPOSSaleScreen } from '@/features/kiosk/presentation/screens/KioskPOSSaleScreen';
import { useKioskStore } from '@/features/kiosk/application/stores/kioskStore';
import { useCartStore } from '@/features/sale/application/stores/cartStore';
import { Payment } from '@/features/sale/domain/sale';
import { ScreenSurface } from '@/shared/ui/index';

export type SaleStackParamList = {
  POSSale: undefined;
  KioskSetup: undefined;
  Cart: undefined;
  Discount: undefined;
  Payment: undefined;
  Receipt: { saleNo: string; payments: Payment[] };
};

const Stack = createStackNavigator<SaleStackParamList>();

const SaleEntryScreen: React.FC<{
  onOpenCart: () => void;
  onOpenHoldBill: () => void;
  onOpenCustomerDisplay: () => void;
  onCancelBill: () => void;
  onExitKiosk: () => void;
}> = (props) => {
  const { isKioskMode } = useKioskStore();
  if (isKioskMode) {
    return <KioskPOSSaleScreen onOpenCart={props.onOpenCart} onExitKiosk={props.onExitKiosk} />;
  }
  return (
    <PosSaleScreen
      onOpenCart={props.onOpenCart}
      onOpenScanner={() => {}}
      onOpenHoldBill={props.onOpenHoldBill}
      onOpenCustomerDisplay={props.onOpenCustomerDisplay}
      onCancelBill={props.onCancelBill}
    />
  );
};

export const SaleNavigator: React.FC = () => {
  const { getGrandTotal } = useCartStore();

  return (
    <Stack.Navigator screenLayout={({ children }) => <ScreenSurface>{children}</ScreenSurface>} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="POSSale">
        {(props) => (
          <SaleEntryScreen
            onOpenCart={() => props.navigation.navigate('Cart')}
            onOpenHoldBill={() => {}}
            onOpenCustomerDisplay={() => {}}
            onCancelBill={() => {}}
            onExitKiosk={() => props.navigation.navigate('POSSale')}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name="KioskSetup" options={{ presentation: 'modal', gestureEnabled: false }}>
        {() => <KioskSetupScreen onStart={() => {}} onCancel={() => {}} />}
      </Stack.Screen>

      <Stack.Screen name="Cart">
        {(props) => (
          <CartScreen
            onBack={() => props.navigation.goBack()}
            onCheckout={() => props.navigation.navigate('Payment')}
            onDiscount={() => props.navigation.navigate('Discount')}
            onHoldBill={() => {}}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name="Discount">
        {(props) => (
          <DiscountScreen
            onBack={() => props.navigation.goBack()}
            onApplyDiscount={() => props.navigation.navigate('Cart')}
            subtotal={getGrandTotal()}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name="Payment">
        {(props) => (
          <PaymentScreen
            onBack={() => props.navigation.goBack()}
            onPayComplete={() => props.navigation.navigate('POSSale')}
            grandTotal={getGrandTotal()}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name="Receipt">
        {(props) => (
          <ReceiptScreen
            onBack={() => props.navigation.navigate('POSSale')}
            onPrint={() => {}}
            onShare={() => {}}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

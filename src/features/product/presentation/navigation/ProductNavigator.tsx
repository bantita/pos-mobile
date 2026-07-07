/**
 * Product Navigator — M04
 * ProductList → AddProduct / EditProduct / ImportExport / CategoryManage
 */
import React from 'react';
import { createStackNavigator } from "expo-router/build/react-navigation/stack";
import { ProductListScreen } from '@/features/product/presentation/screens/ProductListScreen';
import { AddEditProductScreen } from '@/features/product/presentation/screens/AddEditProductScreen';
import { ImportExportScreen } from '@/features/product/presentation/screens/ImportExportScreen';
import { CategoryManageScreen } from '@/features/product/presentation/screens/CategoryManageScreen';
import { ProductMaster } from '@/features/product/domain/product';
import { ScreenSurface } from '@/shared/ui/index';

export type ProductStackParamList = {
  ProductList: undefined;
  AddProduct: undefined;
  EditProduct: { product: ProductMaster };
  ImportExport: undefined;
  CategoryManage: undefined;
};

const Stack = createStackNavigator<ProductStackParamList>();

export const ProductNavigator: React.FC = () => (
  <Stack.Navigator screenLayout={({ children }) => <ScreenSurface>{children}</ScreenSurface>} screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ProductList">
      {(props) => (
        <ProductListScreen
          onAddProduct={() => props.navigation.navigate('AddProduct')}
          onEditProduct={(product) => props.navigation.navigate('EditProduct', { product })}
          onImportExport={() => props.navigation.navigate('ImportExport')}
          onManageCategories={() => props.navigation.navigate('CategoryManage')}
        />
      )}
    </Stack.Screen>

    <Stack.Screen name="AddProduct">
      {(props) => (
        <AddEditProductScreen
          onBack={() => props.navigation.goBack()}
          onSaved={() => props.navigation.goBack()}
        />
      )}
    </Stack.Screen>

    <Stack.Screen name="EditProduct">
      {(props) => (
        <AddEditProductScreen
          product={props.route.params.product}
          onBack={() => props.navigation.goBack()}
          onSaved={() => props.navigation.goBack()}
        />
      )}
    </Stack.Screen>

    <Stack.Screen name="ImportExport">
      {(props) => (
        <ImportExportScreen
          onBack={() => props.navigation.goBack()}
        />
      )}
    </Stack.Screen>

    <Stack.Screen name="CategoryManage">
      {(props) => (
        <CategoryManageScreen
          onBack={() => props.navigation.goBack()}
        />
      )}
    </Stack.Screen>
  </Stack.Navigator>
);

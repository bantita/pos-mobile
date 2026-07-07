import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { Colors } from '@/shared/ui/index';

export default function AppTabs() {
  return (
    <NativeTabs
      backgroundColor={Colors.background}
      indicatorColor={Colors.primary}
      labelStyle={{ selected: { color: Colors.primary } }}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/home.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

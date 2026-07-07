import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import * as Lucide from 'lucide-react-native';

type IconProps = {
  name: string;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
  strokeWidth?: number;
};

const explicitIcons: Record<string, keyof typeof Lucide> = {
  add: 'Plus',
  'add-circle': 'CirclePlus',
  'add-circle-outline': 'CirclePlus',
  'add-outline': 'Plus',
  'alert-circle': 'CircleAlert',
  'alert-circle-outline': 'CircleAlert',
  'albums-outline': 'LibraryBig',
  analytics: 'ChartNoAxesCombined',
  'analytics-outline': 'ChartNoAxesCombined',
  'apps-outline': 'LayoutGrid',
  'archive': 'Archive',
  'archive-outline': 'Archive',
  'arrow-back': 'ArrowLeft',
  'arrow-back-outline': 'ArrowLeft',
  'arrow-down-circle': 'CircleArrowDown',
  'arrow-down-circle-outline': 'CircleArrowDown',
  'arrow-forward': 'ArrowRight',
  'arrow-forward-circle': 'CircleArrowRight',
  'arrow-forward-outline': 'ArrowRight',
  'arrow-up-circle': 'CircleArrowUp',
  'arrow-up-circle-outline': 'CircleArrowUp',
  'arrow-undo-outline': 'Undo2',
  'attach-outline': 'Paperclip',
  'backspace-outline': 'Delete',
  'bar-chart': 'ChartColumn',
  'bar-chart-outline': 'ChartColumn',
  barcode: 'Barcode',
  'barcode-outline': 'Barcode',
  business: 'Building2',
  'business-outline': 'Building2',
  calculator: 'Calculator',
  'calculator-outline': 'Calculator',
  calendar: 'Calendar',
  'calendar-outline': 'Calendar',
  call: 'Phone',
  'call-outline': 'Phone',
  card: 'CreditCard',
  'card-outline': 'CreditCard',
  cash: 'Banknote',
  'cash-outline': 'Banknote',
  cart: 'ShoppingCart',
  'cart-outline': 'ShoppingCart',
  chatbox: 'MessageSquare',
  chatbubble: 'MessageCircle',
  'chatbubble-ellipses': 'MessageCircleMore',
  'chatbubble-ellipses-outline': 'MessageCircleMore',
  'chatbubble-outline': 'MessageCircle',
  'chatbubbles-outline': 'MessagesSquare',
  checkbox: 'SquareCheckBig',
  'checkbox-outline': 'Square',
  checkmark: 'Check',
  'checkmark-circle': 'CircleCheck',
  'checkmark-circle-outline': 'CircleCheck',
  'checkmark-done': 'ListChecks',
  'checkmark-done-outline': 'ListChecks',
  chevronBack: 'ChevronLeft',
  'chevron-back': 'ChevronLeft',
  'chevron-down': 'ChevronDown',
  'chevron-forward': 'ChevronRight',
  'chevron-up': 'ChevronUp',
  close: 'X',
  'close-circle': 'CircleX',
  'close-circle-outline': 'CircleX',
  'close-outline': 'X',
  'cloud-done-outline': 'CloudCheck',
  'cloud-offline-outline': 'CloudOff',
  'cloud-outline': 'Cloud',
  'cloud-upload': 'CloudUpload',
  'cloud-upload-outline': 'CloudUpload',
  'contract-outline': 'Minimize2',
  'color-wand-outline': 'WandSparkles',
  create: 'Pencil',
  'create-outline': 'Pencil',
  cube: 'Package',
  'cube-outline': 'Package',
  cut: 'Scissors',
  'cut-outline': 'Scissors',
  'desktop-outline': 'Monitor',
  document: 'FileText',
  'document-outline': 'FileText',
  'document-text': 'FileText',
  'document-text-outline': 'FileText',
  download: 'Download',
  'download-outline': 'Download',
  'ellipse-outline': 'Circle',
  'expand-outline': 'Maximize2',
  'exit-outline': 'LogOut',
  eye: 'Eye',
  'eye-off-outline': 'EyeOff',
  'eye-outline': 'Eye',
  flash: 'Zap',
  'flash-outline': 'Zap',
  'flash-off-outline': 'ZapOff',
  'flask-outline': 'FlaskConical',
  footsteps: 'Footprints',
  'game-controller': 'Gamepad2',
  'game-controller-outline': 'Gamepad2',
  grid: 'LayoutGrid',
  'grid-outline': 'LayoutGrid',
  'git-merge-outline': 'GitMerge',
  'hardware-chip-outline': 'Cpu',
  help: 'CircleQuestionMark',
  'help-circle': 'CircleQuestionMark',
  'help-circle-outline': 'CircleQuestionMark',
  home: 'House',
  'home-outline': 'House',
  'hand-left': 'Hand',
  'heart-circle': 'Heart',
  'hourglass-outline': 'Hourglass',
  'information-circle': 'Info',
  'information-circle-outline': 'Info',
  key: 'KeyRound',
  'key-outline': 'KeyRound',
  'keypad-outline': 'Grid3x3',
  layers: 'Layers',
  'layers-outline': 'Layers',
  list: 'List',
  'list-outline': 'List',
  location: 'MapPin',
  'location-outline': 'MapPin',
  'lock-closed': 'Lock',
  'lock-closed-outline': 'Lock',
  'lock-open-outline': 'LockOpen',
  'log-out-outline': 'LogOut',
  'logo-linkedin': 'BriefcaseBusiness',
  'logo-whatsapp': 'MessageCircle',
  menu: 'Menu',
  'menu-outline': 'Menu',
  notifications: 'Bell',
  'notifications-outline': 'Bell',
  'navigate-outline': 'Navigation',
  'open-outline': 'ExternalLink',
  'options-outline': 'SlidersHorizontal',
  'paper-plane': 'Send',
  'paper-plane-outline': 'Send',
  'pause-circle': 'CirclePause',
  'pause-circle-outline': 'CirclePause',
  people: 'Users',
  'people-circle': 'Users',
  'people-circle-outline': 'Users',
  'people-outline': 'Users',
  person: 'User',
  'person-add': 'UserPlus',
  'person-add-outline': 'UserPlus',
  'person-circle': 'CircleUserRound',
  'person-circle-outline': 'CircleUserRound',
  'person-outline': 'User',
  'person-remove-outline': 'UserMinus',
  'phone-portrait-outline': 'Smartphone',
  'pencil-outline': 'Pencil',
  play: 'Play',
  'play-circle': 'CirclePlay',
  pricetag: 'Tag',
  'pricetag-outline': 'Tag',
  'pricetags-outline': 'Tags',
  print: 'Printer',
  'print-outline': 'Printer',
  'pulse-outline': 'Activity',
  'radio-button-off': 'Circle',
  'radio-button-on': 'CircleDot',
  receipt: 'ReceiptText',
  'receipt-outline': 'ReceiptText',
  refresh: 'RefreshCw',
  'refresh-circle': 'RotateCw',
  'refresh-circle-outline': 'RotateCw',
  'refresh-outline': 'RefreshCw',
  remove: 'Minus',
  'remove-circle': 'CircleMinus',
  'remove-circle-outline': 'CircleMinus',
  'return-down-back': 'Undo2',
  resize: 'PanelTopClose',
  'resize-outline': 'PanelTopClose',
  save: 'Save',
  'save-outline': 'Save',
  scan: 'ScanLine',
  'scan-outline': 'ScanLine',
  search: 'Search',
  'search-outline': 'Search',
  settings: 'Settings',
  'settings-outline': 'Settings',
  shield: 'Shield',
  'shield-checkmark': 'ShieldCheck',
  'shield-checkmark-outline': 'ShieldCheck',
  square: 'Square',
  'square-outline': 'Square',
  star: 'Star',
  'star-outline': 'Star',
  stats: 'ChartNoAxesColumnIncreasing',
  'stats-chart-outline': 'ChartNoAxesColumnIncreasing',
  'stop-circle': 'CircleStop',
  'stop-outline': 'Square',
  storefront: 'Store',
  'storefront-outline': 'Store',
  'swap-horizontal-outline': 'ArrowLeftRight',
  'swap-horizontal': 'ArrowLeftRight',
  'swap-horizontal-circle': 'Repeat2',
  'swap-vertical': 'ArrowUpDown',
  'swap-vertical-outline': 'ArrowUpDown',
  sync: 'RefreshCw',
  'sync-circle': 'RefreshCw',
  'sync-outline': 'RefreshCw',
  'filter-outline': 'Funnel',
  'tablet-landscape-outline': 'Tablet',
  'tablet-portrait-outline': 'Tablet',
  time: 'Clock',
  'time-outline': 'Clock',
  trash: 'Trash2',
  'trash-outline': 'Trash2',
  'text-outline': 'CaseSensitive',
  'trending-up-outline': 'TrendingUp',
  toggle: 'ToggleRight',
  'toggle-outline': 'ToggleLeft',
  tv: 'Monitor',
  'tv-outline': 'Monitor',
  warning: 'TriangleAlert',
  'warning-outline': 'TriangleAlert',
  'videocam-outline': 'Video',
  'volume-high-outline': 'Volume2',
};

const iconRegistry = Lucide as unknown as Record<string, React.ComponentType<any> | undefined>;

function isIconComponent(component: unknown): component is React.ComponentType<any> {
  return typeof component === 'function' || (typeof component === 'object' && component !== null);
}

function toPascalCase(name: string) {
  return name
    .replace(/-outline$/u, '')
    .split(/[-_\s]+/u)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

const warnedIconNames = new Set<string>();

function resolveIcon(name: string) {
  const explicit = explicitIcons[name];
  if (explicit && isIconComponent(iconRegistry[explicit])) {
    return iconRegistry[explicit] as React.ComponentType<any>;
  }

  const pascal = toPascalCase(name);
  if (isIconComponent(iconRegistry[pascal])) {
    return iconRegistry[pascal] as React.ComponentType<any>;
  }

  if (__DEV__ && !warnedIconNames.has(name)) {
    warnedIconNames.add(name);
    console.warn(`[icons] Unmapped Ionicons name: ${name}`);
  }

  return Lucide.Shapes;
}

export const Ionicons = ({ name, size = 24, color = 'currentColor', style, strokeWidth = 2 }: IconProps) => {
  const Icon = resolveIcon(String(name));
  return <Icon size={size} color={color} style={style} strokeWidth={strokeWidth} />;
};

Ionicons.displayName = 'LucideIoniconsAdapter';
Ionicons.glyphMap = {} as Record<string, number>;
Ionicons.font = {};

export default {
  Ionicons,
};

/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

// Single, dark-mode-only iMessage palette.
// We still expose `light` and `dark` keys so existing hooks/components work,
// but both point to the same dark values.

const iMessageBlue = '#0A84FF';
const iMessageBackground = '#000000';
const iMessageIncoming = '#1C1C1E';
const iMessageOutgoing = iMessageBlue;
const iMessageSeparator = '#38383A';
const iMessageTimestamp = '#6E6E73';
const iMessageComposerBackground = '#1C1C1E';
const iMessageComposerBorder = '#38383A';
const iMessageAvatarBackground = '#636366';

const baseDark = {
  // Core app colors (aligned with iOS dark)
  text: '#ECEDEE',
  background: iMessageBackground,
  tint: iMessageBlue,
  icon: '#9BA1A6',
  tabIconDefault: '#9BA1A6',
  tabIconSelected: iMessageBlue,

  // iMessage-specific colors
  iMessageBackground,
  iMessageBubbleIncoming: iMessageIncoming,
  iMessageBubbleOutgoing: iMessageOutgoing,
  iMessageSeparator,
  iMessageTimestamp,
  iMessageComposerBackground,
  iMessageComposerBorder,
  iMessageAvatarBackground,
};

export const Colors = {
  light: baseDark,
  dark: baseDark,
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

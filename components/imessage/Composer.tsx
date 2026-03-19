import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';

type Props = {
  onSend: (text: string) => void;
};

export function Composer({ onSend }: Props) {
  const [value, setValue] = useState('');
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme() ?? 'dark';
  const colors = Colors[scheme];

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue('');
  };

  const canSend = value.trim().length > 0;

  const content = (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={styles.row}>
        <Pressable style={styles.iconButton}>
          <IconSymbol name="plus" size={20} color={colors.tint} />
        </Pressable>
        <View style={[styles.inputWrapper, { backgroundColor: colors.iMessageBubbleIncoming }]}>
          <TextInput
            value={value}
            onChangeText={setValue}
            placeholder="iMessage"
            placeholderTextColor={colors.iMessageTimestamp}
            style={[styles.input, { color: colors.text }]}
            multiline
          />
          <View style={styles.inlineIcons}>
            <IconSymbol name="camera" size={18} color={colors.iMessageTimestamp} />
            <IconSymbol name="waveform" size={18} color={colors.iMessageTimestamp} />
          </View>
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.sendButton,
            {
              opacity: canSend ? (pressed ? 0.7 : 1) : 0.4,
            },
          ]}
          disabled={!canSend}
          onPress={handleSend}>
          <Text style={styles.sendLabel}>Send</Text>
        </Pressable>
      </View>
    </View>
  );

  if (Platform.OS === 'ios') {
    return (
      <KeyboardAvoidingView behavior="padding">{content}</KeyboardAvoidingView>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 6,
    paddingHorizontal: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
  },
  iconButton: {
    padding: 4,
  },
  inputWrapper: {
    flex: 1,
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 4,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    fontSize: 17,
    maxHeight: 90,
  },
  inlineIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 4,
  },
  sendButton: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  sendLabel: {
    fontSize: 17,
    color: '#0A84FF',
    fontWeight: '600',
  },
});


import { StyleSheet, View, Text } from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';

type Props = {
  name: string;
};

export function ImessageHeader({ name }: Props) {
  const scheme = useColorScheme() ?? 'dark';
  const colors = Colors[scheme];

  return (
    <View style={[styles.container, { borderBottomColor: colors.iMessageSeparator }]}>
      <View style={styles.topRow}>
        <View style={styles.leftGroup}>
          <IconSymbol name="chevron.left" size={20} color={colors.tint} />
          <Text style={[styles.messagesLabel, { color: colors.tint }]}>Messages</Text>
        </View>
        <View style={styles.rightGroup}>
          <IconSymbol name="video.fill" size={20} color={colors.tint} />
          <IconSymbol name="phone.fill" size={20} color={colors.tint} />
        </View>
      </View>
      <View style={styles.bottomRow}>
        <View style={[styles.avatar, { backgroundColor: colors.iMessageAvatarBackground }]}>
          <Text style={styles.avatarInitial}>{name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.nameBlock}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {name}
          </Text>
          <View style={styles.subtitleRow}>
            <Text style={[styles.subtle, { color: colors.iMessageTimestamp }]}>iMessage</Text>
            <IconSymbol name="chevron.right" size={14} color={colors.iMessageTimestamp} />
          </View>
        </View>
        <IconSymbol name="ellipsis.circle" size={22} color={colors.tint} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  messagesLabel: {
    fontSize: 17,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 24,
  },
  nameBlock: {
    flex: 1,
    marginHorizontal: 12,
  },
  name: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  subtitleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  subtle: {
    fontSize: 13,
  },
});


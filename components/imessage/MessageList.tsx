import { useEffect, useRef } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { MessageBubble } from '@/components/imessage/MessageBubble';
import type { Message } from '@/components/imessage/types';

type Props = {
  messages: Message[];
};

export function MessageList({ messages }: Props) {
  const scheme = useColorScheme() ?? 'dark';
  const colors = Colors[scheme];
  const listRef = useRef<FlatList<Message>>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollToEnd({ animated: true });
    }
  }, [messages.length]);

  const renderItem = ({ item, index }: { item: Message; index: number }) => {
    const prev = messages[index - 1];
    const next = messages[index + 1];
    const isFirstInGroup = !prev || prev.author !== item.author;
    const isLastInGroup = !next || next.author !== item.author;

    return (
      <View>
        {item.showTimestampAbove ? (
          <View style={styles.timestampContainer}>
            <Text style={[styles.timestamp, { color: colors.iMessageTimestamp }]}>{item.timestamp}</Text>
          </View>
        ) : null}
        <MessageBubble message={item} isFirstInGroup={isFirstInGroup} isLastInGroup={isLastInGroup} />
        {item.showStatusBelow ? (
          <View style={styles.statusContainer}>
            <Text style={[styles.status, { color: colors.iMessageTimestamp }]}>Delivered</Text>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <FlatList
      ref={listRef}
      data={messages}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingTop: 4,
    paddingBottom: 8,
  },
  timestampContainer: {
    alignItems: 'center',
    marginVertical: 6,
  },
  timestamp: {
    fontSize: 13,
  },
  statusContainer: {
    alignItems: 'flex-end',
    paddingRight: 20,
    marginTop: 2,
  },
  status: {
    fontSize: 13,
  },
});


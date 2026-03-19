import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { Message } from '@/components/imessage/types';

type Props = {
  message: Message;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
};

function MessageBubbleInner({ message, isFirstInGroup, isLastInGroup }: Props) {
  const scheme = useColorScheme() ?? 'dark';
  const colors = Colors[scheme];
  const isMe = message.author === 'me';

  const largeRadius = 18;
  const smallRadius = 6;

  let borderTopLeftRadius = largeRadius;
  let borderTopRightRadius = largeRadius;
  let borderBottomLeftRadius = largeRadius;
  let borderBottomRightRadius = largeRadius;

  if (isMe) {
    // Outgoing bubbles (right side)
    if (isFirstInGroup && !isLastInGroup) {
      // First in group
      borderBottomRightRadius = smallRadius;
    } else if (!isFirstInGroup && !isLastInGroup) {
      // Middle of group
      borderTopRightRadius = smallRadius;
      borderBottomRightRadius = smallRadius;
    } else if (isLastInGroup && !isFirstInGroup) {
      // Last in group
      borderTopRightRadius = smallRadius;
      borderBottomRightRadius = largeRadius;
    }
  } else {
    // Incoming bubbles (left side)
    if (isFirstInGroup && !isLastInGroup) {
      borderBottomLeftRadius = smallRadius;
    } else if (!isFirstInGroup && !isLastInGroup) {
      borderTopLeftRadius = smallRadius;
      borderBottomLeftRadius = smallRadius;
    } else if (isLastInGroup && !isFirstInGroup) {
      borderTopLeftRadius = smallRadius;
      borderBottomLeftRadius = largeRadius;
    }
  }

  const bubbleStyle = {
    backgroundColor: isMe ? colors.iMessageBubbleOutgoing : colors.iMessageBubbleIncoming,
    alignSelf: isMe ? ('flex-end' as const) : ('flex-start' as const),
    borderTopLeftRadius,
    borderTopRightRadius,
    borderBottomLeftRadius,
    borderBottomRightRadius,
  };

  const textColor = isMe ? '#fff' : colors.text;

  return (
    <View style={[styles.row, { justifyContent: isMe ? 'flex-end' : 'flex-start' }]}>
      <View style={styles.bubbleWrapper}>
        <View
          style={[
            styles.bubble,
            bubbleStyle,
            {
              marginTop: isFirstInGroup ? 6 : 2,
              marginBottom: isLastInGroup ? 6 : 2,
            },
          ]}>
          <Text style={[styles.text, { color: textColor }]}>{message.text}</Text>
        </View>
        {isLastInGroup ? (
          <View
            style={[
              styles.tail,
              {
                backgroundColor: isMe ? colors.iMessageBubbleOutgoing : colors.iMessageBubbleIncoming,
                alignSelf: isMe ? 'flex-end' : 'flex-start',
                marginRight: isMe ? 4 : 0,
                marginLeft: isMe ? 0 : 4,
              },
            ]}
          />
        ) : null}
      </View>
    </View>
  );
}

export const MessageBubble = memo(MessageBubbleInner);

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 12,
  },
  bubbleWrapper: {
    maxWidth: '78%',
  },
  bubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  text: {
    fontSize: 17,
    lineHeight: 22,
  },
  tail: {
    width: 10,
    height: 10,
    borderRadius: 5,
    transform: [{ rotate: '45deg' }],
    marginTop: -4,
  },
});


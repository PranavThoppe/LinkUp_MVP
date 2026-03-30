import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  FlatList,
  ListRenderItem,
} from 'react-native';
import Animated, { Easing, interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { CalendarCard, type CalendarVote } from '@/components/imessage/CalendarCard';
import { WeekCard, type WeekVote } from '@/components/imessage/WeekCard';
import { DaysCard, type DaysVote } from '@/components/imessage/DaysCard';
import { CompactView } from '../components/imessage/CompactView';

type SenderId = 'P' | 'S' | 'J';

type LocalMessage = {
  id: string;
  text: string;
  fromMe: boolean;
  timestamp: string;
  sender?: SenderId;
  /** Month-mode schedule card */
  calendarVotes?: CalendarVote[];
  /** Week-mode schedule card */
  weekData?: { startIso: string; endIso: string; votes: WeekVote[] };
  /** Days-mode schedule card */
  daysData?: { selectedDatesIso: string[]; votes: DaysVote[] };
};

const SENDERS: Record<SenderId, { initial: string; color: string }> = {
  P: { initial: 'P', color: '#FF6B9D' },
  S: { initial: 'S', color: '#34C759' },
  J: { initial: 'J', color: '#007AFF' },
};

const INITIAL_MESSAGES: LocalMessage[] = [
  {
    id: '1',
    text: 'can we please hang out this week',
    fromMe: false,
    timestamp: '9:41 AM',
    sender: 'P',
  },
  {
    id: '2',
    text: 'yes I am free on Monday, Wednesday, and Friday',
    fromMe: false,
    timestamp: '9:42 AM',
    sender: 'S',
  },
  {
    id: '3',
    text: 'yo guys I lwky don\'t have a ride...',
    fromMe: false,
    timestamp: '9:43 AM',
    sender: 'J',
  },
  {
    id: '4',
    text: 'Bro why not tuesday 🥺',
    fromMe: true,
    timestamp: '9:44 AM',
  },
  {
    id: 'calendar-1',
    text: '',
    fromMe: false,
    timestamp: '9:42 AM',
    calendarVotes: [
      { sender: 'P', dates: [5, 7, 12, 14, 18] },
      { sender: 'S', dates: [5, 7, 12, 13, 14] },
      { sender: 'J', dates: [5, 14, 19, 20] },
    ],
  },
];

export default function ImessagePreviewScreen() {
  const [messages, setMessages] = useState<LocalMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [showCompact, setShowCompact] = useState(false);
  const listRef = useRef<FlatList<LocalMessage> | null>(null);

  const data = useMemo(() => messages, [messages]);

  const compactProgress = useSharedValue(0);
  useEffect(() => {
    compactProgress.value = withTiming(showCompact ? 1 : 0, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
    });
  }, [showCompact, compactProgress]);

  const compactPanelStyle = useAnimatedStyle(() => {
    const height = interpolate(compactProgress.value, [0, 1], [0, 300]);
    const translateY = interpolate(compactProgress.value, [0, 1], [300, 0]);
    const opacity = interpolate(compactProgress.value, [0, 1], [0, 1]);
    return {
      height,
      transform: [{ translateY }],
      opacity,
    };
  });

  const plusRotationStyle = useAnimatedStyle(() => {
    const rotateDeg = interpolate(compactProgress.value, [0, 1], [0, 45]);
    return {
      transform: [{ rotateZ: `${rotateDeg}deg` }],
    };
  });

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const now = new Date();
    const timestamp = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

    const newMessage: LocalMessage = {
      id: `${Date.now()}`,
      text: trimmed,
      fromMe: true,
      timestamp,
    };

    setMessages(prev => [...prev, newMessage]);
    setInput('');

    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
  }, [input]);

  const handleScheduleSend = useCallback(
    (payload: Parameters<NonNullable<React.ComponentProps<typeof CompactView>['onSend']>>[0]) => {
      const now = new Date();
      const timestamp = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      const id = `schedule-${Date.now()}`;

      let newMessage: LocalMessage | null = null;

      if (payload.mode === 'month' && payload.months && payload.months.length > 0) {
        newMessage = {
          id,
          text: '',
          fromMe: false,
          timestamp,
          sender: 'P',
          calendarVotes: [],
        };
      } else if (payload.mode === 'week' && payload.week) {
        newMessage = {
          id,
          text: '',
          fromMe: false,
          timestamp,
          sender: 'P',
          weekData: { startIso: payload.week.startIso, endIso: payload.week.endIso, votes: [] },
        };
      } else if (payload.mode === 'days' && payload.days) {
        newMessage = {
          id,
          text: '',
          fromMe: false,
          timestamp,
          sender: 'P',
          daysData: { selectedDatesIso: payload.days.selectedDatesIso, votes: [] },
        };
      }

      if (!newMessage) return;

      setMessages(prev => [...prev, newMessage!]);
      requestAnimationFrame(() => {
        listRef.current?.scrollToEnd({ animated: true });
      });
    },
    []
  );

  const handlePlusPress = useCallback(() => {
    Keyboard.dismiss();
    setShowCompact(v => !v);
  }, []);

  const renderItem: ListRenderItem<LocalMessage> = ({ item }) => {
    if (item.calendarVotes) {
      return (
        <View style={[styles.messageRow, styles.rowLeft]}>
          <View style={styles.calendarCardWrap}>
            <CalendarCard month={2} year={2026} votes={item.calendarVotes} senders={SENDERS} />
          </View>
        </View>
      );
    }

    if (item.weekData) {
      return (
        <View style={[styles.messageRow, styles.rowLeft]}>
          <View style={styles.calendarCardWrap}>
            <WeekCard
              startIso={item.weekData.startIso}
              endIso={item.weekData.endIso}
              votes={item.weekData.votes}
              senders={SENDERS}
            />
          </View>
        </View>
      );
    }

    if (item.daysData) {
      return (
        <View style={[styles.messageRow, styles.rowLeft]}>
          <View style={styles.calendarCardWrap}>
            <DaysCard
              selectedDatesIso={item.daysData.selectedDatesIso}
              votes={item.daysData.votes}
              senders={SENDERS}
            />
          </View>
        </View>
      );
    }

    if (item.fromMe) {
      return (
        <View style={[styles.messageRow, styles.rowRight]}>
          <View style={styles.bubbleWrapperOutgoing}>
            <View style={[styles.bubble, styles.bubbleOutgoing]}>
              <Text style={[styles.bubbleText, styles.bubbleTextOutgoing]}>{item.text}</Text>
            </View>
          </View>
        </View>
      );
    }

    const sender = item.sender && SENDERS[item.sender] ? SENDERS[item.sender] : SENDERS.P;

    return (
      <View style={[styles.messageRow, styles.rowLeft]}>
        <View style={styles.incomingMessageContent}>
          <Text style={styles.senderLabel}>{sender.initial}</Text>
          <View style={styles.incomingBubbleRow}>
            <View style={[styles.profileIcon, { backgroundColor: sender.color }]}>
              <Text style={styles.profileIconText}>{sender.initial}</Text>
            </View>
            <View style={styles.bubbleWrapperIncoming}>
              <View style={[styles.bubble, styles.bubbleIncoming]}>
                <Text style={styles.bubbleText}>{item.text}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.headerBack}>{'‹'}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.headerCenter}>
            <View style={styles.headerAvatarsRow}>
              <View style={[styles.headerAvatar, { backgroundColor: SENDERS.P.color }]}>
                <Text style={styles.headerAvatarText}>P</Text>
              </View>
              <View style={[styles.headerAvatar, styles.headerAvatarOverlap, { backgroundColor: SENDERS.S.color }]}>
                <Text style={styles.headerAvatarText}>S</Text>
              </View>
              <View style={[styles.headerAvatar, styles.headerAvatarOverlap, { backgroundColor: SENDERS.J.color }]}>
                <Text style={styles.headerAvatarText}>J</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.headerGroupRow} activeOpacity={0.7}>
              <Text style={styles.headerGroupName}>Group</Text>
              <Text style={styles.headerGroupChevron}>{'›'}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.headerRight} />
        </View>

        {/* Message list */}
        <View style={styles.listContainer}>
          <FlatList
            ref={listRef}
            data={data}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            keyboardShouldPersistTaps="handled"
          />
        </View>

        {/* Composer */}
        <View style={styles.composerContainer}>
          <View style={styles.composerInner}>
            <TouchableOpacity
              style={styles.composerAddonButton}
              activeOpacity={0.7}
              onPress={handlePlusPress}>
              <Animated.Text style={[styles.composerAddonText, plusRotationStyle]}>+</Animated.Text>
            </TouchableOpacity>
            {!showCompact ? (
              <TextInput
                style={styles.input}
                value={input}
                onChangeText={setInput}
                placeholder="iMessage"
                placeholderTextColor="#7A7A7F"
                multiline
              />
            ) : (
              <Text style={styles.compactComposerPlaceholder}>Select dates below</Text>
            )}
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!input.trim() || showCompact) && styles.sendButtonDisabled,
              ]}
              activeOpacity={0.8}
              onPress={handleSend}
              disabled={!input.trim() || showCompact}>
              <Text style={styles.sendButtonText}>↑</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      <Animated.View style={[styles.compactPanelWrapper, compactPanelStyle]} pointerEvents={showCompact ? 'auto' : 'none'}>
        <CompactView onClose={() => setShowCompact(false)} onSend={handleScheduleSend} />
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
  },
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#262629',
  },
  headerLeft: {
    flex: 1,
    justifyContent: 'center',
  },
  headerBack: {
    fontSize: 28,
    color: '#007AFF',
  },
  headerCenter: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarOverlap: {
    marginLeft: -8,
  },
  headerAvatarText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerGroupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  headerGroupName: {
    fontSize: 15,
    color: '#8E8E93',
  },
  headerGroupChevron: {
    fontSize: 14,
    color: '#8E8E93',
  },
  headerRight: {
    flex: 1,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  messageRow: {
    marginVertical: 6,
    flexDirection: 'row',
  },
  calendarCardWrap: {
    width: '92%',
    maxWidth: 380,
  },
  rowLeft: {
    justifyContent: 'flex-start',
  },
  rowRight: {
    justifyContent: 'flex-end',
  },
  senderLabel: {
    fontSize: 11,
    color: '#8E8E93',
    marginBottom: 2,
    marginLeft: 36,
  },
  incomingMessageContent: {
    maxWidth: '85%',
  },
  incomingBubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  profileIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  profileIconText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bubbleWrapperIncoming: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    maxWidth: '100%',
  },
  bubbleWrapperOutgoing: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    maxWidth: '80%',
  },
  bubble: {
    maxWidth: '100%',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleIncoming: {
    backgroundColor: '#2C2C2E',
  },
  bubbleOutgoing: {
    backgroundColor: '#0A84FF',
  },
  bubbleText: {
    fontSize: 16,
    color: '#F2F2F7',
  },
  bubbleTextOutgoing: {
    color: '#FFFFFF',
  },
  composerContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#262629',
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#000000',
  },
  composerInner: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#1C1C1E',
    borderRadius: 22,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  composerAddonButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  composerAddonText: {
    fontSize: 22,
    color: '#007AFF',
    marginTop: -2,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    paddingHorizontal: 4,
    paddingVertical: 4,
    fontSize: 16,
    color: '#FFFFFF',
  },
  sendButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  sendButtonDisabled: {
    backgroundColor: '#3A3A3C',
  },
  sendButtonText: {
    fontSize: 18,
    color: '#FFFFFF',
    marginTop: -1,
  },
  compactComposerPlaceholder: {
    flex: 1,
    maxHeight: 120,
    paddingHorizontal: 4,
    paddingVertical: 4,
    fontSize: 16,
    color: '#6E6E73',
    lineHeight: 20,
  },
  compactPanelWrapper: {
    overflow: 'hidden',
    backgroundColor: '#000000',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#262629',
  },
});


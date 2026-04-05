import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

type SenderId = 'P' | 'S' | 'J';

export type CalendarVote = {
  sender: SenderId;
  dates: number[];
};

type CalendarCardProps = {
  month: number; // 0-indexed
  year: number;
  votes: CalendarVote[];
  senders: Record<SenderId, { initial: string; color: string }>;
  /** When set with `onSelfDatesChange`, expanded days toggle this sender's availability. */
  selfSenderId?: SenderId;
  onSelfDatesChange?: (dates: number[]) => void;
};

type Cell = {
  day: number;
  inMonth: boolean;
};

const DOW = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const;

function monthName(month: number) {
  return new Date(2000, month, 1).toLocaleString(undefined, { month: 'long' });
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function hexToRgb(hex: string) {
  const h = hex.replace('#', '').trim();
  if (h.length !== 6) return { r: 0, g: 0, b: 0 };
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return { r, g, b };
}

function rgbToHex(r: number, g: number, b: number) {
  const toHex = (n: number) => Math.round(n).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function getVoteGradientColor(voteCount: number, maxVotes: number) {
  if (voteCount <= 0 || maxVotes <= 0) return undefined;

  const minColor = '#2A2F2A';
  const maxColor = '#34C759';

  const t = clamp01(voteCount / maxVotes);
  const a = hexToRgb(minColor);
  const b = hexToRgb(maxColor);
  return rgbToHex(lerp(a.r, b.r, t), lerp(a.g, b.g, t), lerp(a.b, b.b, t));
}

function buildMonthGrid(month: number, year: number): Cell[] {
  const firstOfMonth = new Date(year, month, 1);
  const startDow = firstOfMonth.getDay(); // 0=Sun

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells: Cell[] = [];

  for (let i = 0; i < startDow; i++) {
    cells.push({ day: daysInPrevMonth - (startDow - 1 - i), inMonth: false });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ day, inMonth: true });
  }

  while (cells.length < 35) {
    const day = cells.length - (startDow + daysInMonth) + 1;
    cells.push({ day, inMonth: false });
  }

  return cells;
}

type GridStyles = {
  dowRow: object;
  dowText: object;
  grid: object;
  cell: object;
  dateTop: object;
  dateBadge: object;
  dateBadgeOut: object;
  dateText: object;
  dateTextOnColor: object;
  dateTextOut: object;
  voteDotsRow: object;
  voteDotsRowPlaceholder: object;
  voteDot: object;
};

type MonthGridProps = {
  grid: Cell[];
  votesByDay: Map<number, SenderId[]>;
  maxVotes: number;
  senders: Record<SenderId, { initial: string; color: string }>;
  styles: GridStyles;
  selfSenderId?: SenderId;
  selfDates: number[];
  /** Per-day outline for the current user's picks (expanded sheet only). */
  showSelfDayOutline?: boolean;
  interactive?: boolean;
  onToggleDay?: (day: number) => void;
};

function MonthGrid({
  grid,
  votesByDay,
  maxVotes,
  senders,
  styles: s,
  selfSenderId,
  selfDates,
  showSelfDayOutline = false,
  interactive,
  onToggleDay,
}: MonthGridProps) {
  const selfSet = useMemo(() => new Set(selfDates), [selfDates]);
  const selfColor = selfSenderId ? senders[selfSenderId]?.color : undefined;

  return (
    <>
      <View style={s.dowRow}>
        {DOW.map(d => (
          <Text key={d} style={s.dowText}>
            {d}
          </Text>
        ))}
      </View>

      <View style={s.grid}>
        {grid.map((cell, idx) => {
          const voters = cell.inMonth ? votesByDay.get(cell.day) ?? [] : [];
          const voteColor = cell.inMonth ? getVoteGradientColor(voters.length, maxVotes) : undefined;
          const isSelfPick = cell.inMonth && selfSenderId && selfSet.has(cell.day);
          const canPress = interactive && cell.inMonth && !!onToggleDay;

          const inner = (
            <>
              <View style={s.dateTop}>
                <View
                  style={[
                    s.dateBadge,
                    voteColor && { backgroundColor: voteColor },
                    !cell.inMonth && s.dateBadgeOut,
                    isSelfPick &&
                      showSelfDayOutline &&
                      selfColor && {
                        borderWidth: 2,
                        borderColor: selfColor,
                      },
                  ]}>
                  <Text
                    style={[
                      s.dateText,
                      voteColor && s.dateTextOnColor,
                      !cell.inMonth && s.dateTextOut,
                    ]}>
                    {cell.day}
                  </Text>
                </View>
              </View>

              {cell.inMonth && voters.length ? (
                <View style={s.voteDotsRow}>
                  {voters.map(v => (
                    <View key={v} style={[s.voteDot, { backgroundColor: senders[v].color }]} />
                  ))}
                </View>
              ) : (
                <View style={s.voteDotsRowPlaceholder} />
              )}
            </>
          );

          if (canPress) {
            return (
              <Pressable
                key={`${idx}-${cell.day}`}
                style={s.cell}
                onPress={() => onToggleDay!(cell.day)}
                accessibilityRole="button"
                accessibilityLabel={`${cell.day}, ${isSelfPick ? 'selected' : 'not selected'}`}>
                {inner}
              </Pressable>
            );
          }

          return (
            <View key={`${idx}-${cell.day}`} style={s.cell}>
              {inner}
            </View>
          );
        })}
      </View>
    </>
  );
}

type ExpandedProps = {
  month: number;
  year: number;
  grid: Cell[];
  votesByDay: Map<number, SenderId[]>;
  maxVotes: number;
  votedSenders: SenderId[];
  senders: Record<SenderId, { initial: string; color: string }>;
  selfSenderId?: SenderId;
  selfDates: number[];
  selfHasVoted: boolean;
  onToggleDay?: (day: number) => void;
  onClose: () => void;
};

function CalendarCardExpanded({
  month,
  year,
  grid,
  votesByDay,
  maxVotes,
  votedSenders,
  senders,
  selfSenderId,
  selfDates,
  selfHasVoted,
  onToggleDay,
  onClose,
}: ExpandedProps) {
  const subtitle =
    !onToggleDay
      ? 'Availability'
      : selfHasVoted
        ? 'Tap days to update your availability'
        : "Tap days you're available";

  return (
    <View style={expandedStyles.screen}>
      <View style={expandedStyles.header}>
        <View style={expandedStyles.headerText}>
          <View style={expandedStyles.titleRow}>
            <Text style={expandedStyles.title}>
              {monthName(month)} {year}
            </Text>
            {!!selfSenderId && selfHasVoted ? (
              <View style={expandedStyles.respondedPill}>
                <Text style={expandedStyles.respondedPillText}>You voted</Text>
              </View>
            ) : null}
          </View>
          <Text style={expandedStyles.subtitle}>{subtitle}</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={expandedStyles.closeBtn} activeOpacity={0.7}>
          <Text style={expandedStyles.closeBtnText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={expandedStyles.scrollFlex}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={expandedStyles.scrollContent}
        keyboardShouldPersistTaps="handled">
        <MonthGrid
          grid={grid}
          votesByDay={votesByDay}
          maxVotes={maxVotes}
          senders={senders}
          styles={{
            dowRow: expandedStyles.dowRow,
            dowText: expandedStyles.dowText,
            grid: expandedStyles.grid,
            cell: expandedStyles.cell,
            dateTop: expandedStyles.dateTop,
            dateBadge: expandedStyles.dateBadge,
            dateBadgeOut: expandedStyles.dateBadgeOut,
            dateText: expandedStyles.dateText,
            dateTextOnColor: expandedStyles.dateTextOnColor,
            dateTextOut: expandedStyles.dateTextOut,
            voteDotsRow: expandedStyles.voteDotsRow,
            voteDotsRowPlaceholder: expandedStyles.voteDotsRowPlaceholder,
            voteDot: expandedStyles.voteDot,
          }}
          selfSenderId={selfSenderId}
          selfDates={selfDates}
          showSelfDayOutline={!!onToggleDay}
          interactive={!!onToggleDay}
          onToggleDay={onToggleDay}
        />

        {votedSenders.length > 0 && (
          <>
            <View style={expandedStyles.legendSep} />
            <Text style={expandedStyles.legendTitle}>Voted</Text>
            <View style={expandedStyles.legendRow}>
              {votedSenders.map(sid => (
                <View
                  key={sid}
                  style={[expandedStyles.legendAvatar, { backgroundColor: senders[sid]?.color ?? '#8E8E93' }]}>
                  <Text style={expandedStyles.legendAvatarText}>{senders[sid]?.initial ?? sid}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={expandedStyles.doneBar}>
        <TouchableOpacity
          style={expandedStyles.doneButton}
          onPress={onClose}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Done">
          <Text style={expandedStyles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

export function CalendarCard({
  month,
  year,
  votes,
  senders,
  selfSenderId,
  onSelfDatesChange,
}: CalendarCardProps) {
  const [expanded, setExpanded] = useState(false);
  const grid = useMemo(() => buildMonthGrid(month, year), [month, year]);

  const votesByDay = useMemo(() => {
    const map = new Map<number, SenderId[]>();
    for (const vote of votes) {
      for (const d of vote.dates) {
        const arr = map.get(d) ?? [];
        if (!arr.includes(vote.sender)) arr.push(vote.sender);
        map.set(d, arr);
      }
    }
    return map;
  }, [votes]);

  const maxVotes = useMemo(() => {
    let max = 0;
    for (const arr of votesByDay.values()) max = Math.max(max, arr.length);
    return max;
  }, [votesByDay]);

  const votedSenders = useMemo(() => {
    const set = new Set<SenderId>();
    for (const v of votes) {
      if (v.dates.length > 0) set.add(v.sender);
    }
    return Array.from(set);
  }, [votes]);

  const selfDates = useMemo(() => {
    if (!selfSenderId) return [];
    return votes.find(v => v.sender === selfSenderId)?.dates ?? [];
  }, [votes, selfSenderId]);

  const handleToggleDay = (day: number) => {
    if (!onSelfDatesChange || !selfSenderId) return;
    const current = votes.find(v => v.sender === selfSenderId)?.dates ?? [];
    const next = current.includes(day)
      ? current.filter(d => d !== day)
      : [...current, day].sort((a, b) => a - b);
    onSelfDatesChange(next);
  };

  const trackSelfVote = !!selfSenderId && !!onSelfDatesChange;
  const selfHasVoted = selfDates.length > 0;

  return (
    <>
      <Pressable
        onPress={() => setExpanded(true)}
        style={[
          cardStyles.card,
          trackSelfVote && (selfHasVoted ? cardStyles.cardSelfResponded : cardStyles.cardNeedsYou),
        ]}>
        <View style={cardStyles.headerRow}>
          <Text style={cardStyles.monthText}>
            {monthName(month)} {year}
          </Text>
          {trackSelfVote ? (
            <View style={[cardStyles.statusPill, selfHasVoted ? cardStyles.statusPillDone : cardStyles.statusPillPending]}>
              <Text style={[cardStyles.statusPillText, selfHasVoted ? cardStyles.statusPillTextDone : undefined]}>
                {selfHasVoted ? 'You voted' : 'Your turn'}
              </Text>
            </View>
          ) : null}
        </View>

        <MonthGrid
          grid={grid}
          votesByDay={votesByDay}
          maxVotes={maxVotes}
          senders={senders}
          styles={{
            dowRow: cardStyles.dowRow,
            dowText: cardStyles.dowText,
            grid: cardStyles.grid,
            cell: cardStyles.cell,
            dateTop: cardStyles.dateTop,
            dateBadge: cardStyles.dateBadge,
            dateBadgeOut: cardStyles.dateBadgeOut,
            dateText: cardStyles.dateText,
            dateTextOnColor: cardStyles.dateTextOnColor,
            dateTextOut: cardStyles.dateTextOut,
            voteDotsRow: cardStyles.voteDotsRow,
            voteDotsRowPlaceholder: cardStyles.voteDotsRowPlaceholder,
            voteDot: cardStyles.voteDot,
          }}
          selfSenderId={selfSenderId}
          selfDates={selfDates}
          showSelfDayOutline={false}
        />

        <View style={cardStyles.footerSep} />
        <View style={cardStyles.footer}>
          <View style={cardStyles.footerLeft}>
            {votedSenders.length > 0
              ? votedSenders.map(sid => (
                  <View
                    key={sid}
                    style={[cardStyles.footerAvatar, { backgroundColor: senders[sid]?.color ?? '#8E8E93' }]}>
                    <Text style={cardStyles.footerAvatarText}>{senders[sid]?.initial ?? sid}</Text>
                  </View>
                ))
              : null}
            <Text style={cardStyles.footerVoted}>{votedSenders.length} voted</Text>
          </View>
          <Text style={cardStyles.footerCta}>
            {trackSelfVote ? (selfHasVoted ? 'Update times →' : 'Tap to vote →') : 'Tap to open →'}
          </Text>
        </View>
      </Pressable>

      <Modal visible={expanded} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaProvider>
          <SafeAreaView style={modalSafeArea} edges={['top', 'left', 'right']}>
            <CalendarCardExpanded
              month={month}
              year={year}
              grid={grid}
              votesByDay={votesByDay}
              maxVotes={maxVotes}
              votedSenders={votedSenders}
              senders={senders}
              selfSenderId={selfSenderId}
              selfDates={selfDates}
              selfHasVoted={selfHasVoted}
              onToggleDay={onSelfDatesChange ? handleToggleDay : undefined}
              onClose={() => setExpanded(false)}
            />
          </SafeAreaView>
        </SafeAreaProvider>
      </Modal>
    </>
  );
}

const modalSafeArea = { flex: 1, backgroundColor: '#1C1C1E' };

const expandedStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#1C1C1E',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#38383A',
  },
  headerText: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  respondedPill: {
    backgroundColor: '#1A3D26',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#34C759',
  },
  respondedPillText: {
    color: '#34C759',
    fontSize: 12,
    fontWeight: '700',
  },
  subtitle: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2C2C2E',
  },
  closeBtnText: {
    color: '#EBEBF5',
    fontSize: 16,
    fontWeight: '500',
  },
  scrollFlex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  doneBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#38383A',
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  doneButton: {
    backgroundColor: '#0A84FF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  dowRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  dowText: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    color: '#8E8E93',
    fontSize: 13,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    paddingVertical: 10,
    alignItems: 'center',
  },
  dateTop: {
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateBadge: {
    minWidth: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    backgroundColor: 'transparent',
  },
  dateBadgeOut: {
    opacity: 0.45,
  },
  dateText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  dateTextOnColor: {
    color: '#FFFFFF',
  },
  dateTextOut: {
    color: '#8E8E93',
  },
  voteDotsRow: {
    flexDirection: 'row',
    marginTop: 6,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  voteDotsRowPlaceholder: {
    marginTop: 6,
    height: 20,
  },
  voteDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendSep: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#38383A',
    marginTop: 20,
    marginBottom: 12,
  },
  legendTitle: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 10,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  legendAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendAvatarText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 10,
    borderWidth: 1,
    borderColor: '#38383A',
  },
  cardNeedsYou: {
    borderColor: '#FF9F0A',
    backgroundColor: '#1C1C1E',
  },
  cardSelfResponded: {
    borderColor: '#34C759',
    backgroundColor: '#1A221C',
  },
  headerRow: {
    marginBottom: 10,
    alignItems: 'center',
    gap: 8,
  },
  monthText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  statusPillPending: {
    backgroundColor: '#2C2419',
    borderColor: '#FF9F0A',
  },
  statusPillDone: {
    backgroundColor: '#1A2E1F',
    borderColor: '#34C759',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF9F0A',
  },
  statusPillTextDone: {
    color: '#34C759',
  },
  dowRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  dowText: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    paddingVertical: 6,
    alignItems: 'center',
  },
  dateTop: {
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    backgroundColor: 'transparent',
  },
  dateBadgeOut: {
    opacity: 0.45,
  },
  dateText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  dateTextOnColor: {
    color: '#FFFFFF',
  },
  dateTextOut: {
    color: '#8E8E93',
  },
  voteDotsRow: {
    flexDirection: 'row',
    marginTop: 4,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  voteDotsRowPlaceholder: {
    marginTop: 4,
    height: 16,
  },
  voteDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  footerSep: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#38383A',
    marginTop: 10,
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerAvatarText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  footerVoted: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 2,
  },
  footerCta: {
    color: '#0A84FF',
    fontSize: 12,
    fontWeight: '600',
  },
});
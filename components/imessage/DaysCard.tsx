import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { parseISODateLocal } from './calendarGrid';

// ─── Types ───────────────────────────────────────────────────────────────────

type SenderId = string;

export type DaysVote = {
  sender: SenderId;
  /** ISO dates (YYYY-MM-DD) the sender is available on */
  dates: string[];
};

type Props = {
  /** The specific days the sender chose */
  selectedDatesIso: string[];
  votes: DaysVote[];
  senders: Record<SenderId, { initial: string; color: string }>;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const SLOTS = ['Morn', 'Aftn', 'Eve', 'Night'] as const;

/**
 * Compact cards show up to this many columns before the inner scroll kicks in.
 * Beyond this threshold the column width stays fixed at COMPACT_SCROLL_COL_W.
 */
const COMPACT_SCROLL_THRESHOLD = 5;
const COMPACT_SCROLL_COL_W = 44;

// ─── Pure helpers ─────────────────────────────────────────────────────────────

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
function hexToRgb(hex: string) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}
function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b].map(n => Math.round(n).toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}
function getVoteColor(count: number, max: number): string | undefined {
  if (count <= 0 || max <= 0) return undefined;
  const t = clamp01(count / max);
  const a = hexToRgb('#2A2F2A');
  const b = hexToRgb('#34C759');
  return rgbToHex(lerp(a.r, b.r, t), lerp(a.g, b.g, t), lerp(a.b, b.b, t));
}

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function dowAbbr(iso: string): string {
  return ['S', 'M', 'T', 'W', 'T', 'F', 'S'][parseISODateLocal(iso).getDay()];
}

function shortDateLabel(iso: string): string {
  return parseISODateLocal(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function headerLabel(selectedDatesIso: string[]): string {
  if (selectedDatesIso.length === 0) return 'No days selected';
  if (selectedDatesIso.length === 1) return shortDateLabel(selectedDatesIso[0]);
  const sorted = [...selectedDatesIso].sort();
  return `${shortDateLabel(sorted[0])} + ${selectedDatesIso.length - 1} more`;
}

// ─── Shared grid ─────────────────────────────────────────────────────────────

type SlotGridProps = {
  days: string[];
  today: string;
  votesByDay: Map<string, SenderId[]>;
  maxVotes: number;
  /** Fixed pixel width per day column (undefined = flex:1) */
  colWidth?: number;
  showVoterDots?: boolean;
  senders?: Record<SenderId, { initial: string; color: string }>;
};

function SlotGrid({ days, today, votesByDay, maxVotes, colWidth, showVoterDots, senders }: SlotGridProps) {
  const colStyle = colWidth ? { width: colWidth, alignItems: 'center' as const } : { flex: 1, alignItems: 'center' as const };

  return (
    <View style={gridStyles.wrapper}>
      {/* Day-of-week row */}
      <View style={gridStyles.row}>
        <View style={gridStyles.labelCell} />
        {days.map(iso => (
          <View key={`dow-${iso}`} style={colStyle}>
            <Text style={[gridStyles.dowText, iso === today && gridStyles.dowTextToday]}>
              {dowAbbr(iso)}
            </Text>
          </View>
        ))}
      </View>

      {/* Day-number row */}
      <View style={[gridStyles.row, gridStyles.dateRow]}>
        <View style={gridStyles.labelCell} />
        {days.map(iso => {
          const isToday = iso === today;
          return (
            <View key={`num-${iso}`} style={colStyle}>
              <View style={[gridStyles.dayNumBadge, isToday && gridStyles.dayNumBadgeToday]}>
                <Text style={[gridStyles.dayNumText, isToday && gridStyles.dayNumTextToday]}>
                  {parseISODateLocal(iso).getDate()}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Slot rows */}
      {SLOTS.map(slot => (
        <View key={slot} style={gridStyles.row}>
          <View style={gridStyles.labelCell}>
            <Text style={gridStyles.slotLabel}>{slot}</Text>
          </View>
          {days.map(iso => {
            const count = votesByDay.get(iso)?.length ?? 0;
            const color = getVoteColor(count, maxVotes);
            return (
              <View key={`${slot}-${iso}`} style={colStyle}>
                <View style={[gridStyles.slotCell, color ? { backgroundColor: color } : gridStyles.slotCellEmpty]} />
              </View>
            );
          })}
        </View>
      ))}

      {/* Voter dot rows (expanded view only) */}
      {showVoterDots && senders && (
        <View style={[gridStyles.row, gridStyles.voterRow]}>
          <View style={gridStyles.labelCell} />
          {days.map(iso => {
            const voters = votesByDay.get(iso) ?? [];
            return (
              <View key={`voters-${iso}`} style={[colStyle, gridStyles.voterDotCol]}>
                {voters.map(s => (
                  <View
                    key={s}
                    style={[gridStyles.voterDot, { backgroundColor: senders[s]?.color ?? '#8E8E93' }]}
                  />
                ))}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const gridStyles = StyleSheet.create({
  wrapper: {
    marginTop: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  dateRow: {
    marginBottom: 6,
  },
  voterRow: {
    marginTop: 4,
    marginBottom: 0,
  },
  labelCell: {
    width: 38,
    alignItems: 'flex-end',
    paddingRight: 6,
  },
  dowText: {
    color: '#8E8E93',
    fontSize: 11,
    fontWeight: '700',
  },
  dowTextToday: {
    color: '#0A84FF',
  },
  dayNumBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumBadgeToday: {
    backgroundColor: '#0A84FF',
  },
  dayNumText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  dayNumTextToday: {
    color: '#FFFFFF',
  },
  slotLabel: {
    color: '#8E8E93',
    fontSize: 10,
    fontWeight: '600',
  },
  slotCell: {
    width: 30,
    height: 26,
    borderRadius: 6,
  },
  slotCellEmpty: {
    backgroundColor: '#2C2C2E',
  },
  voterDotCol: {
    flexDirection: 'column',
    gap: 2,
    justifyContent: 'flex-start',
    minHeight: 20,
  },
  voterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});

// ─── Expanded modal ───────────────────────────────────────────────────────────

type ExpandedProps = {
  days: string[];
  today: string;
  votesByDay: Map<string, SenderId[]>;
  maxVotes: number;
  votedSenderIds: SenderId[];
  senders: Record<SenderId, { initial: string; color: string }>;
  selectedDatesIso: string[];
  onClose: () => void;
};

function DaysCardExpanded({
  days,
  today,
  votesByDay,
  maxVotes,
  votedSenderIds,
  senders,
  selectedDatesIso,
  onClose,
}: ExpandedProps) {
  return (
    <View style={expandedStyles.container}>
      <View style={expandedStyles.header}>
        <View style={expandedStyles.headerText}>
          <Text style={expandedStyles.title}>{selectedDatesIso.length} Days</Text>
          <Text style={expandedStyles.subtitle}>pick your times</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={expandedStyles.closeBtn} activeOpacity={0.7}>
          <Text style={expandedStyles.closeBtnText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={expandedStyles.scrollH}>
        <SlotGrid
          days={days}
          today={today}
          votesByDay={votesByDay}
          maxVotes={maxVotes}
          colWidth={COMPACT_SCROLL_COL_W}
          showVoterDots
          senders={senders}
        />
      </ScrollView>

      {votedSenderIds.length > 0 && (
        <>
          <View style={expandedStyles.legendSep} />
          <Text style={expandedStyles.legendTitle}>Voted</Text>
          <View style={expandedStyles.legendRow}>
            {votedSenderIds.map(s => (
              <View
                key={s}
                style={[expandedStyles.legendAvatar, { backgroundColor: senders[s]?.color ?? '#8E8E93' }]}>
                <Text style={expandedStyles.legendAvatarText}>{senders[s]?.initial ?? s}</Text>
              </View>
            ))}
          </View>
        </>
      )}
    </View>
  );
}

const expandedStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingBottom: 4,
  },
  headerText: {
    flex: 1,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  subtitle: {
    color: '#8E8E93',
    fontSize: 13,
    fontWeight: '500',
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#3A3A3C',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  closeBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  scrollH: {
    paddingBottom: 8,
  },
  legendSep: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#38383A',
    marginTop: 16,
    marginBottom: 12,
  },
  legendTitle: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  legendRow: {
    flexDirection: 'row',
    gap: 8,
  },
  legendAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendAvatarText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});

// ─── Main export ──────────────────────────────────────────────────────────────

export function DaysCard({ selectedDatesIso, votes, senders }: Props) {
  const [expanded, setExpanded] = useState(false);
  const today = useMemo(() => todayIso(), []);

  const days = useMemo(() => [...selectedDatesIso].sort(), [selectedDatesIso]);
  const needsScroll = days.length > COMPACT_SCROLL_THRESHOLD;

  const votesByDay = useMemo(() => {
    const map = new Map<string, SenderId[]>();
    for (const vote of votes) {
      for (const d of vote.dates) {
        if (!days.includes(d)) continue;
        const arr = map.get(d) ?? [];
        if (!arr.includes(vote.sender)) arr.push(vote.sender);
        map.set(d, arr);
      }
    }
    return map;
  }, [votes, days]);

  const maxVotes = useMemo(() => {
    let max = 0;
    for (const arr of votesByDay.values()) max = Math.max(max, arr.length);
    return max;
  }, [votesByDay]);

  const votedSenderIds = useMemo(() => {
    const set = new Set<SenderId>();
    for (const v of votes) set.add(v.sender);
    return Array.from(set);
  }, [votes]);

  const subheader = useMemo(() => headerLabel(selectedDatesIso), [selectedDatesIso]);

  const grid = (
    <SlotGrid
      days={days}
      today={today}
      votesByDay={votesByDay}
      maxVotes={maxVotes}
      colWidth={needsScroll ? COMPACT_SCROLL_COL_W : undefined}
      showVoterDots={false}
    />
  );

  return (
    <>
      <Pressable onPress={() => setExpanded(true)} style={cardStyles.card}>
        <Text style={cardStyles.title}>{selectedDatesIso.length} Days</Text>
        <Text style={cardStyles.subtitle}>{subheader} · pick your times</Text>

        {needsScroll ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={cardStyles.scrollContent}>
            {grid}
          </ScrollView>
        ) : (
          grid
        )}

        <View style={cardStyles.footerSep} />
        <View style={cardStyles.footer}>
          <View style={cardStyles.footerLeft}>
            {votedSenderIds.map(s => (
              <View
                key={s}
                style={[cardStyles.footerAvatar, { backgroundColor: senders[s]?.color ?? '#8E8E93' }]}>
                <Text style={cardStyles.footerAvatarText}>{senders[s]?.initial ?? s}</Text>
              </View>
            ))}
            <Text style={cardStyles.footerVoted}>{votedSenderIds.length} voted</Text>
          </View>
          <Text style={cardStyles.footerCta}>Tap to vote →</Text>
        </View>
      </Pressable>

      <Modal visible={expanded} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#1C1C1E' }}>
          <DaysCardExpanded
            days={days}
            today={today}
            votesByDay={votesByDay}
            maxVotes={maxVotes}
            votedSenderIds={votedSenderIds}
            senders={senders}
            selectedDatesIso={selectedDatesIso}
            onClose={() => setExpanded(false)}
          />
        </SafeAreaView>
      </Modal>
    </>
  );
}

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
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  subtitle: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '500',
  },
  scrollContent: {
    paddingRight: 4,
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

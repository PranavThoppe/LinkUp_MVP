import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

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

  // Leading days from previous month.
  for (let i = 0; i < startDow; i++) {
    cells.push({ day: daysInPrevMonth - (startDow - 1 - i), inMonth: false });
  }

  // Current month.
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ day, inMonth: true });
  }

  // Trailing days to fill a 5x7 grid.
  while (cells.length < 35) {
    const day = cells.length - (startDow + daysInMonth) + 1;
    cells.push({ day, inMonth: false });
  }

  return cells;
}

export function CalendarCard({ month, year, votes, senders }: CalendarCardProps) {
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
    for (const v of votes) set.add(v.sender);
    return Array.from(set);
  }, [votes]);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.monthText}>
          {monthName(month)} {year}
        </Text>
      </View>

      <View style={styles.dowRow}>
        {DOW.map(d => (
          <Text key={d} style={styles.dowText}>
            {d}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {grid.map((cell, idx) => {
          const voters = cell.inMonth ? votesByDay.get(cell.day) ?? [] : [];
          const voteColor = cell.inMonth ? getVoteGradientColor(voters.length, maxVotes) : undefined;

          return (
            <View key={`${idx}-${cell.day}`} style={styles.cell}>
              <View style={styles.dateTop}>
                <View
                  style={[
                    styles.dateBadge,
                    voteColor && { backgroundColor: voteColor },
                    !cell.inMonth && styles.dateBadgeOut,
                  ]}>
                  <Text
                    style={[
                      styles.dateText,
                      voteColor && styles.dateTextOnColor,
                      !cell.inMonth && styles.dateTextOut,
                    ]}>
                    {cell.day}
                  </Text>
                </View>
              </View>

              {cell.inMonth && voters.length ? (
                <View style={styles.voteDotsRow}>
                  {voters.map(v => (
                    <View key={v} style={[styles.voteDot, { backgroundColor: senders[v].color }]} />
                  ))}
                </View>
              ) : (
                <View style={styles.voteDotsRowPlaceholder} />
              )}
            </View>
          );
        })}
      </View>

      <View style={styles.footerSeparator} />
      <Text style={styles.footerTitle}>Voted</Text>
      <View style={styles.footerAvatarsRow}>
        {votedSenders.map(s => (
          <View key={s} style={[styles.footerAvatar, { backgroundColor: senders[s].color }]}>
            <Text style={styles.footerAvatarText}>{senders[s].initial}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#38383A',
  },
  headerRow: {
    marginBottom: 10,
    alignItems: 'center',
  },
  monthText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
  footerSeparator: {
    marginTop: 10,
    marginBottom: 10,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#38383A',
  },
  footerTitle: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  footerAvatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerAvatarText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});


import React, { useMemo, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { buildMonthGridSunFirst, monthName, parseISODateLocal, toISODateLocal } from './calendarGrid';

type Props = {
  startIso: string | null; // YYYY-MM-DD
  endIso: string | null; // YYYY-MM-DD
  onChangeRange: (next: { startIso: string | null; endIso: string | null }) => void;
};

type MonthItem = {
  month: number;
  year: number;
  key: string;
};

const DOW_ORDER = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

function addDaysIsoLocal(iso: string, deltaDays: number) {
  const d = parseISODateLocal(iso);
  d.setDate(d.getDate() + deltaDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function buildUpcomingMonths(count: number): MonthItem[] {
  const now = new Date();
  const startMonth = now.getMonth();
  const startYear = now.getFullYear();
  const months: MonthItem[] = [];

  for (let i = 0; i < count; i++) {
    const absoluteMonth = startMonth + i;
    const month = absoluteMonth % 12;
    const year = startYear + Math.floor(absoluteMonth / 12);
    months.push({ month, year, key: `${year}-${String(month + 1).padStart(2, '0')}` });
  }

  return months;
}

function todayIsoLocal() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatShortDate(iso: string) {
  return parseISODateLocal(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

export function CompactWeekPicker({ startIso, endIso, onChangeRange }: Props) {
  const months = useMemo(() => buildUpcomingMonths(18), []);
  const todayIso = useMemo(() => todayIsoLocal(), []);
  const todayLocalDate = useMemo(() => parseISODateLocal(todayIso), [todayIso]);
  const firstMonthKey = months[0]?.key ?? null;

  const scrollRef = useRef<ScrollView | null>(null);
  const firstMonthLayoutYRef = useRef<number | null>(null);
  const todayRowLayoutYRef = useRef<number | null>(null);
  const didScrollRef = useRef(false);

  

  const handleTapDate = (iso: string) => {
    if (iso < todayIso) return;

    if (startIso && endIso) {
      // Range is complete. Tapping the endpoints shrinks (deselects) the range.
      if (iso === startIso) {
        if (startIso === endIso) {
          onChangeRange({ startIso: null, endIso: null });
          return;
        }

        const nextStart = addDaysIsoLocal(startIso, +1);
        if (nextStart > endIso) {
          onChangeRange({ startIso: null, endIso: null });
          return;
        }

        onChangeRange({ startIso: nextStart, endIso });
        return;
      }

      if (iso === endIso) {
        const nextEnd = addDaysIsoLocal(endIso, -1);
        if (nextEnd < startIso) {
          onChangeRange({ startIso: null, endIso: null });
          return;
        }

        onChangeRange({ startIso, endIso: nextEnd });
        return;
      }

      // Any other tap starts a new range.
      onChangeRange({ startIso: iso, endIso: null });
      return;
    }

    if (!startIso) {
      onChangeRange({ startIso: iso, endIso: null });
      return;
    }

    // startIso exists and endIso is null.
    if (iso < startIso) {
      onChangeRange({ startIso: iso, endIso: startIso });
      return;
    }

    onChangeRange({ startIso, endIso: iso });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pick Date Range</Text>

      <View style={styles.dowRow}>
        {DOW_ORDER.map(d => (
          <Text key={d} style={styles.dowText}>
            {d}
          </Text>
        ))}
      </View>

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {months.map(month => {
          const grid = buildMonthGridSunFirst(month.month, month.year);
          const rows: { cell: (typeof grid)[number]; idx: number }[][] = [];
          for (let i = 0; i < grid.length; i += 7) {
            rows.push(grid.slice(i, i + 7).map((cell, j) => ({ cell, idx: i + j })));
          }

          const isTodayMonth = month.year === todayLocalDate.getFullYear() && month.month === todayLocalDate.getMonth();
          const todayCellIndex = isTodayMonth ? grid.findIndex(c => c.inMonth && toISODateLocal(month.year, month.month, c.day) === todayIso) : -1;
          const todayRowIndex = todayCellIndex >= 0 ? Math.floor(todayCellIndex / 7) : -1;
          const isFirstMonth = firstMonthKey != null && month.key === firstMonthKey;

          return (
            <View
              key={month.key}
              style={styles.monthBlock}
              onLayout={e => {
                if (!isFirstMonth) return;
                firstMonthLayoutYRef.current = e.nativeEvent.layout.y;

                if (didScrollRef.current) return;
                if (todayRowLayoutYRef.current == null) return;

                didScrollRef.current = true;
                const y = firstMonthLayoutYRef.current + todayRowLayoutYRef.current - 90;
                const safeY = Math.max(0, y);
                requestAnimationFrame(() => {
                  scrollRef.current?.scrollTo({ y: safeY, animated: false });
                });
              }}>
              <Text style={styles.monthTitle}>
                {monthName(month.month)} {month.year}
              </Text>
              <View style={styles.grid}>
                {rows.map((weekCells, rowIdx) => (
                  <View
                    key={`${month.key}-row-${rowIdx}`}
                    style={styles.weekRow}
                    onLayout={e => {
                      if (!isTodayMonth) return;
                      if (rowIdx !== todayRowIndex) return;
                      todayRowLayoutYRef.current = e.nativeEvent.layout.y;
                      if (didScrollRef.current) return;
                      if (firstMonthLayoutYRef.current == null) return;

                      didScrollRef.current = true;
                      const y = firstMonthLayoutYRef.current + todayRowLayoutYRef.current - 90;
                      const safeY = Math.max(0, y);
                      requestAnimationFrame(() => {
                        scrollRef.current?.scrollTo({ y: safeY, animated: false });
                      });
                    }}>
                    {weekCells.map(({ cell, idx }) => {
                  if (!cell.inMonth) {
                    return (
                      <View key={`${month.key}-${idx}-out`} style={styles.cell}>
                        <View style={styles.dayDisabled}>
                          <Text style={styles.dayDisabledText}>{cell.day}</Text>
                        </View>
                      </View>
                    );
                  }

                  const iso = toISODateLocal(month.year, month.month, cell.day);
                  const isPast = iso < todayIso;
                  const isStart = startIso === iso;
                  const isEnd = endIso === iso;
                  const isInRange = Boolean(startIso && endIso && iso >= startIso && iso <= endIso);
                  const isEndpoint = isStart || isEnd;

                  return (
                    <View key={`${month.key}-${idx}-${iso}`} style={styles.cell}>
                      <Pressable
                        onPress={() => handleTapDate(iso)}
                        disabled={isPast}
                        style={[
                          styles.dayPressable,
                          isInRange && styles.dayInRange,
                          isEndpoint && styles.dayEndpoint,
                          isPast && styles.dayPast,
                        ]}>
                        <Text
                          style={[
                            styles.dayText,
                            isInRange && styles.dayTextInRange,
                            isPast && styles.dayTextPast,
                          ]}>
                          {cell.day}
                        </Text>
                      </Pressable>
                    </View>
                  );
                    })}
                  </View>
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 6,
  },
  title: {
    color: '#34C759',
    fontSize: 18,
    fontWeight: '700',
  },
  subtext: {
    marginTop: 4,
    color: '#6E6E73',
    fontSize: 12,
    fontWeight: '600',
  },
  dowRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 6,
  },
  dowText: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    color: '#6E6E73',
    fontSize: 11,
    fontWeight: '700',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  monthBlock: {
    marginBottom: 16,
  },
  monthTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  grid: {
    flexDirection: 'column',
  },
  weekRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
  },
  cell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
    paddingVertical: 3,
  },
  dayPressable: {
    width: 34,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  dayInRange: {
    backgroundColor: 'rgba(52,199,89,0.22)',
  },
  dayEndpoint: {
    backgroundColor: '#34C759',
  },
  dayPast: {
    opacity: 0.3,
  },
  dayText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  dayTextInRange: {
    color: '#FFFFFF',
  },
  dayTextPast: {
    color: '#FFFFFF',
  },
  dayDisabled: {
    width: 34,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.18,
  },
  dayDisabledText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});


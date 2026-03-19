import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Props = {
  weekStartIso: string; // YYYY-MM-DD (Monday)
  onChangeWeekStartIso: (iso: string) => void;
};

function parseISODateLocal(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  // Use local date components to avoid timezone shifts.
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

function toISODateLocal(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDays(d: Date, days: number) {
  const next = new Date(d);
  next.setDate(next.getDate() + days);
  return next;
}

function formatWeekLabel(weekStart: Date) {
  const weekEnd = addDays(weekStart, 6);

  const startText = weekStart.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const endText = weekEnd.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return `${startText} — ${endText}`;
}

const DOW_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function CompactWeekPicker({ weekStartIso, onChangeWeekStartIso }: Props) {
  const weekStart = useMemo(() => parseISODateLocal(weekStartIso), [weekStartIso]);
  const weekRangeLabel = useMemo(() => formatWeekLabel(weekStart), [weekStart]);

  const days = useMemo(() => {
    const arr: { iso: string; dayText: string; dateNumber: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = addDays(weekStart, i);
      arr.push({
        iso: toISODateLocal(d),
        dayText: DOW_ORDER[i],
        dateNumber: d.getDate(),
      });
    }
    return arr;
  }, [weekStart]);

  const handlePrev = () => onChangeWeekStartIso(toISODateLocal(addDays(weekStart, -7)));
  const handleNext = () => onChangeWeekStartIso(toISODateLocal(addDays(weekStart, +7)));

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={handlePrev} activeOpacity={0.7} style={styles.arrowButton}>
          <Text style={styles.arrowText}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{weekRangeLabel}</Text>
        <TouchableOpacity onPress={handleNext} activeOpacity={0.7} style={styles.arrowButton}>
          <Text style={styles.arrowText}>{'>'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.stripRow}>
        {days.map(day => (
          <View key={day.iso} style={styles.dayCell}>
            <Text style={styles.dayName}>{day.dayText}</Text>
            <View style={styles.dayBadge}>
              <Text style={styles.dayNumber}>{day.dateNumber}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  arrowButton: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
    height: 36,
  },
  arrowText: {
    color: '#0A84FF',
    fontSize: 18,
    fontWeight: '800',
  },
  title: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    marginHorizontal: 4,
  },
  stripRow: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  dayCell: {
    flex: 1,
    alignItems: 'center',
  },
  dayName: {
    color: '#6E6E73',
    fontSize: 11,
    fontWeight: '700',
  },
  dayBadge: {
    marginTop: 6,
    width: 32,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10,132,255,0.18)',
  },
  dayNumber: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
});


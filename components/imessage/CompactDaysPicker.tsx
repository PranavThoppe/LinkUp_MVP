import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Props = {
  selectedDatesIso: string[]; // YYYY-MM-DD
  onChangeSelectedDatesIso: (next: string[]) => void;
};

function toISODateLocal(y: number, m0: number, day: number) {
  const year = y;
  const month = String(m0 + 1).padStart(2, '0');
  const date = String(day).padStart(2, '0');
  return `${year}-${month}-${date}`;
}

function parseISODateLocal(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

function monthName(month: number) {
  return new Date(2000, month, 1).toLocaleString(undefined, { month: 'long' });
}

function stepMonth(month: number, year: number, delta: number) {
  let nextMonth = month + delta;
  let nextYear = year;

  while (nextMonth < 0) {
    nextMonth += 12;
    nextYear -= 1;
  }

  while (nextMonth > 11) {
    nextMonth -= 12;
    nextYear += 1;
  }

  return { month: nextMonth, year: nextYear };
}

type Cell = { day: number; inMonth: boolean };

function buildMonthGridMonFirst(month: number, year: number): Cell[] {
  const firstOfMonth = new Date(year, month, 1);
  const startIndexMonFirst = (firstOfMonth.getDay() + 6) % 7; // Monday=0

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells: Cell[] = [];

  for (let i = 0; i < startIndexMonFirst; i++) {
    const day = daysInPrevMonth - (startIndexMonFirst - 1 - i);
    cells.push({ day, inMonth: false });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ day, inMonth: true });
  }

  while (cells.length < 35) {
    const trailingDay = cells.length - (startIndexMonFirst + daysInMonth) + 1;
    cells.push({ day: trailingDay, inMonth: false });
  }

  return cells;
}

function formatShortDate(iso: string) {
  const d = parseISODateLocal(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function CompactDaysPicker({ selectedDatesIso, onChangeSelectedDatesIso }: Props) {
  const now = new Date();
  const [viewMonth, setViewMonth] = useState(now.getMonth()); // 0-indexed
  const [viewYear, setViewYear] = useState(now.getFullYear());

  const grid = useMemo(() => buildMonthGridMonFirst(viewMonth, viewYear), [viewMonth, viewYear]);

  const title = useMemo(() => `${monthName(viewMonth)} ${viewYear}`, [viewMonth, viewYear]);

  const toggleDate = (iso: string) => {
    const exists = selectedDatesIso.includes(iso);
    const next = exists
      ? selectedDatesIso.filter(d => d !== iso)
      : [...selectedDatesIso, iso].sort((a, b) => (a < b ? -1 : 1));
    onChangeSelectedDatesIso(next);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => {
            const next = stepMonth(viewMonth, viewYear, -1);
            setViewMonth(next.month);
            setViewYear(next.year);
          }}
          activeOpacity={0.7}
          style={styles.arrowButton}>
          <Text style={styles.arrowText}>{'<'}</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{title}</Text>

        <TouchableOpacity
          onPress={() => {
            const next = stepMonth(viewMonth, viewYear, +1);
            setViewMonth(next.month);
            setViewYear(next.year);
          }}
          activeOpacity={0.7}
          style={styles.arrowButton}>
          <Text style={styles.arrowText}>{'>'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.dowRow}>
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
          <Text key={d} style={styles.dowText}>
            {d}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {grid.map((cell, idx) => {
          const iso = cell.inMonth ? toISODateLocal(viewYear, viewMonth, cell.day) : '';
          const isSelected = cell.inMonth ? selectedDatesIso.includes(iso) : false;

          return (
            <View key={`${idx}-${cell.day}-${cell.inMonth ? 'in' : 'out'}`} style={styles.cell}>
              {cell.inMonth ? (
                <Pressable onPress={() => toggleDate(iso)} style={styles.dayPressable}>
                  <View
                    style={[
                      styles.dayBadge,
                      isSelected && styles.dayBadgeSelected,
                    ]}>
                    <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>
                      {cell.day}
                    </Text>
                  </View>
                </Pressable>
              ) : (
                <View style={styles.dayBadgeOut}>
                  <Text style={styles.dayTextOut}>{cell.day}</Text>
                </View>
              )}
            </View>
          );
        })}
      </View>

      <View style={styles.pillsHeaderRow}>
        <Text style={styles.pillsHeaderText}>Selected</Text>
      </View>

      {selectedDatesIso.length === 0 ? (
        <Text style={styles.emptyText}>Tap days above to select.</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsRow}>
          {selectedDatesIso.map(iso => (
            <View key={iso} style={styles.pill}>
              <Text style={styles.pillText}>{formatShortDate(iso)}</Text>
              <TouchableOpacity onPress={() => toggleDate(iso)} activeOpacity={0.7} style={styles.pillRemove}>
                <Text style={styles.pillRemoveText}>X</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
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
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginHorizontal: 4,
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
    paddingVertical: 4,
  },
  dayPressable: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  dayBadgeSelected: {
    backgroundColor: '#0A84FF',
  },
  dayText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  dayTextSelected: {
    color: '#FFFFFF',
  },
  dayBadgeOut: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.35,
  },
  dayTextOut: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  pillsHeaderRow: {
    marginTop: 14,
    marginBottom: 6,
  },
  pillsHeaderText: {
    color: '#6E6E73',
    fontWeight: '700',
    fontSize: 12,
  },
  emptyText: {
    color: '#6E6E73',
    fontWeight: '600',
    fontSize: 13,
  },
  pillsRow: {
    gap: 8,
    paddingVertical: 6,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#38383A',
    backgroundColor: '#1C1C1E',
    borderRadius: 999,
    paddingHorizontal: 10,
    height: 32,
    gap: 8,
  },
  pillText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  pillRemove: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#38383A',
  },
  pillRemoveText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
});


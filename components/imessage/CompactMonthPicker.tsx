import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

type Props = {
  selectedMonths: { month: number; year: number }[];
  onChangeSelectedMonths: (next: { month: number; year: number }[]) => void;
};

type MonthItem = {
  month: number;
  year: number;
  key: string;
};

function monthKey(month: number, year: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

function monthLabel(month: number) {
  return new Date(2000, month, 1).toLocaleString(undefined, { month: 'short' });
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
    months.push({ month, year, key: monthKey(month, year) });
  }

  return months;
}

export function CompactMonthPicker({ selectedMonths, onChangeSelectedMonths }: Props) {
  const months = useMemo(() => buildUpcomingMonths(12), []);
  const selectedSet = useMemo(
    () => new Set(selectedMonths.map(m => monthKey(m.month, m.year))),
    [selectedMonths]
  );
  const selectedCount = selectedMonths.length;

  const toggleMonth = (item: MonthItem) => {
    const isSelected = selectedSet.has(item.key);
    const next = isSelected
      ? selectedMonths.filter(m => monthKey(m.month, m.year) !== item.key)
      : [...selectedMonths, { month: item.month, year: item.year }];

    next.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });

    onChangeSelectedMonths(next);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pick Months</Text>
      <Text style={styles.subtext}>
        {selectedCount === 0 ? 'Tap months to include' : `${selectedCount} selected`}
      </Text>

      <ScrollView
        style={styles.scroller}
        contentContainerStyle={styles.gridContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {months.map(item => {
            const isSelected = selectedSet.has(item.key);
            return (
              <Pressable
                key={item.key}
                onPress={() => toggleMonth(item)}
                style={[styles.cell, isSelected && styles.cellSelected]}>
                <Text style={[styles.cellMonth, isSelected && styles.cellMonthSelected]}>
                  {monthLabel(item.month)}
                </Text>
                <Text style={[styles.cellYear, isSelected && styles.cellYearSelected]}>
                  {item.year}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 4,
  },
  title: {
    color: '#34C759',
    fontSize: 18,
    fontWeight: '700',
  },
  subtext: {
    marginTop: 8,
    marginBottom: 12,
    color: '#6E6E73',
    fontSize: 13,
    fontWeight: '600',
  },
  scroller: {
    flex: 1,
  },
  gridContent: {
    paddingBottom: 6,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 0,
  },
  cell: {
    width: '31.8%',
    marginHorizontal: '0.75%',
    marginBottom: 8,
    height: 74,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3A3A3C',
    backgroundColor: '#1C1C1E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellSelected: {
    borderColor: '#34C759',
    backgroundColor: '#34C759',
  },
  cellMonth: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  cellMonthSelected: {
    color: '#FFFFFF',
  },
  cellYear: {
    marginTop: 2,
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '600',
  },
  cellYearSelected: {
    color: '#E7FFE8',
  },
});


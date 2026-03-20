import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import type { ReactNode } from 'react';

import { Colors } from '@/constants/theme';
import type { ScheduleMode } from './compactTypes';
import { CompactMonthPicker } from './CompactMonthPicker';
import { CompactWeekPicker } from './CompactWeekPicker';
import { CompactDaysPicker } from './CompactDaysPicker';

type Props = {
  onClose: () => void;
  onSend?: (payload: {
    mode: ScheduleMode;
    months?: { month: number; year: number }[];
    week?: { startIso: string; endIso: string };
    days?: { selectedDatesIso: string[] };
  }) => void;
};

function monthDefaults() {
  const now = new Date();
  return { month: now.getMonth(), year: now.getFullYear() };
}

export function CompactView({ onClose, onSend }: Props) {
  const [mode, setMode] = useState<ScheduleMode>('month');
  const [selectedMonths, setSelectedMonths] = useState(() => [monthDefaults()]);
  const [weekStartIso, setWeekStartIso] = useState<string | null>(null);
  const [weekEndIso, setWeekEndIso] = useState<string | null>(null);
  const [selectedDatesIso, setSelectedDatesIso] = useState<string[]>([]);

  const schemeColors = Colors.dark;

  const canSend = useMemo(() => {
    if (mode === 'month') return selectedMonths.length > 0;
    if (mode === 'week') return Boolean(weekStartIso && weekEndIso && weekStartIso <= weekEndIso);
    if (mode === 'days') return selectedDatesIso.length > 0;
    return false;
  }, [mode, selectedMonths.length, selectedDatesIso.length, weekStartIso, weekEndIso]);

  const handleSend = () => {
    if (!canSend) return;

    onSend?.({
      mode,
      months: mode === 'month' ? selectedMonths : undefined,
      week:
        mode === 'week' && weekStartIso && weekEndIso
          ? { startIso: weekStartIso, endIso: weekEndIso }
          : undefined,
      days: mode === 'days' ? { selectedDatesIso } : undefined,
    });

    // MVP: we don't yet wire the result into the chat transcript.
    onClose();
  };

  return (
    <View style={[styles.container, { backgroundColor: schemeColors.background }]}>
      <View style={styles.tabBar}>
        <TabButton label="Month" active={mode === 'month'} onPress={() => setMode('month')} />
        <TabButton label="Week" active={mode === 'week'} onPress={() => setMode('week')} />
        <TabButton label="Days" active={mode === 'days'} onPress={() => setMode('days')} />
      </View>

      <View style={styles.content}>
        {renderPicker(
          mode,
          selectedMonths,
          setSelectedMonths,
          weekStartIso,
          setWeekStartIso,
          weekEndIso,
          setWeekEndIso,
          selectedDatesIso,
          setSelectedDatesIso
        )}
      </View>

      <TouchableOpacity
        onPress={handleSend}
        activeOpacity={0.85}
        disabled={!canSend}
        style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}>
        <Text style={styles.sendButtonText}>Send Schedule</Text>
      </TouchableOpacity>
    </View>
  );
}

function renderPicker(
  mode: ScheduleMode,
  selectedMonths: { month: number; year: number }[],
  setSelectedMonths: (v: { month: number; year: number }[]) => void,
  weekStartIso: string | null,
  setWeekStartIso: (v: string | null) => void,
  weekEndIso: string | null,
  setWeekEndIso: (v: string | null) => void,
  selectedDatesIso: string[],
  setSelectedDatesIso: (v: string[]) => void
): ReactNode {
  if (mode === 'week') {
    return (
      <CompactWeekPicker
        startIso={weekStartIso}
        endIso={weekEndIso}
        onChangeRange={({ startIso, endIso }) => {
          setWeekStartIso(startIso);
          setWeekEndIso(endIso);
        }}
      />
    );
  }

  if (mode === 'days') {
    return (
      <CompactDaysPicker selectedDatesIso={selectedDatesIso} onChangeSelectedDatesIso={setSelectedDatesIso} />
    );
  }

  return (
    <CompactMonthPicker
      selectedMonths={selectedMonths}
      onChangeSelectedMonths={setSelectedMonths}
    />
  );
}

function TabButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.tabButton} onPress={onPress} activeOpacity={0.7}>
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
      {active ? <View style={styles.tabUnderline} /> : <View style={styles.tabUnderlineSpacer} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 6,
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  tabBar: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6E6E73',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  tabUnderline: {
    marginTop: 8,
    width: '70%',
    height: 2,
    backgroundColor: '#0A84FF',
    borderRadius: 1,
  },
  tabUnderlineSpacer: {
    marginTop: 8,
    width: '70%',
    height: 2,
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
  },
  sendButton: {
    marginTop: 10,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0A84FF',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});


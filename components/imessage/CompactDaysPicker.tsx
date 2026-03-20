import { IconSymbol } from '@/components/ui/icon-symbol';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useMemo, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { parseISODateLocal, toISODateLocal } from './calendarGrid';

type Props = {
  selectedDatesIso: string[]; // YYYY-MM-DD
  onChangeSelectedDatesIso: (next: string[]) => void;
};

function formatShortDate(iso: string) {
  const d = parseISODateLocal(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function CompactDaysPicker({ selectedDatesIso, onChangeSelectedDatesIso }: Props) {
  const selectedSet = useMemo(() => new Set(selectedDatesIso), [selectedDatesIso]);

  const [pendingDate, setPendingDate] = useState(() => {
    const firstSelectedIso = selectedDatesIso[0];
    if (firstSelectedIso) return parseISODateLocal(firstSelectedIso);
    return new Date();
  });

  const [webDateText, setWebDateText] = useState(() => {
    const firstSelectedIso = selectedDatesIso[0];
    if (firstSelectedIso) return firstSelectedIso;
    const d = new Date();
    return toISODateLocal(d.getFullYear(), d.getMonth(), d.getDate());
  });

  const pendingIso = useMemo(() => {
    return toISODateLocal(pendingDate.getFullYear(), pendingDate.getMonth(), pendingDate.getDate());
  }, [pendingDate]);

  const webDateValid = useMemo(() => {
    return /^\d{4}-\d{2}-\d{2}$/.test(webDateText);
  }, [webDateText]);

  const webIsoToAdd = useMemo(() => {
    if (!webDateValid) return null;
    const d = parseISODateLocal(webDateText);
    return toISODateLocal(d.getFullYear(), d.getMonth(), d.getDate());
  }, [webDateValid, webDateText]);

  const webCanAdd = webIsoToAdd ? !selectedSet.has(webIsoToAdd) : false;
  const nativeCanAdd = !selectedSet.has(pendingIso);

  const addIsoDate = (iso: string) => {
    if (selectedSet.has(iso)) return;
    const next = [...selectedDatesIso, iso].sort((a, b) => (a < b ? -1 : 1));
    onChangeSelectedDatesIso(next);
  };

  const removeIsoDate = (iso: string) => {
    onChangeSelectedDatesIso(selectedDatesIso.filter(d => d !== iso));
  };

  const handlePickerChange = (_event: unknown, date?: Date) => {
    if (!date) return;
    setPendingDate(date);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pick Days</Text>
      <View style={styles.addRow}>
        {Platform.OS === 'web' ? (
          <>
            <TextInput
              value={webDateText}
              onChangeText={setWebDateText}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#6E6E73"
              style={styles.webInputInline}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="numbers-and-punctuation"
            />
            <TouchableOpacity
              onPress={() => {
                if (!webIsoToAdd) return;
                addIsoDate(webIsoToAdd);
              }}
              activeOpacity={0.85}
              style={[styles.plusButton, !webCanAdd && styles.plusButtonDisabled]}
              disabled={!webCanAdd}>
              <IconSymbol name="plus.circle.fill" size={22} color={webCanAdd ? '#0A84FF' : '#38383A'} />
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.pickerInline}>
              <DateTimePicker
                mode="date"
                value={pendingDate}
                display={Platform.OS === 'ios' ? 'compact' : 'default'}
                onChange={handlePickerChange}
              />
            </View>
            <TouchableOpacity
              onPress={() => addIsoDate(pendingIso)}
              activeOpacity={0.85}
              style={[styles.plusButton, !nativeCanAdd && styles.plusButtonDisabled]}
              disabled={!nativeCanAdd}>
              <IconSymbol name="plus.circle.fill" size={22} color={nativeCanAdd ? '#0A84FF' : '#38383A'} />
            </TouchableOpacity>
          </>
        )}
      </View>

      <View style={styles.selectedRow}>
        <Text style={styles.selectedLabel}>Selected</Text>
        <Text style={styles.selectedCount}>{selectedDatesIso.length}</Text>
      </View>

      {selectedDatesIso.length === 0 ? (
        <Text style={styles.emptyText}>Tap the + to add dates.</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsRow}>
          {selectedDatesIso.map(iso => (
            <View key={iso} style={styles.pill}>
              <Text style={styles.pillText}>{formatShortDate(iso)}</Text>
              <TouchableOpacity onPress={() => removeIsoDate(iso)} activeOpacity={0.7} style={styles.pillRemove}>
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
    paddingTop: 2,
  },
  title: {
    color: '#34C759',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  addRow: {
    paddingHorizontal: 2,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pickerInline: {
    flex: 1,
  },
  webInputInline: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#38383A',
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  plusButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#38383A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusButtonDisabled: {
    opacity: 0.6,
  },
  selectedRow: {
    paddingHorizontal: 2,
    marginTop: 6,
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  selectedLabel: {
    color: '#6E6E73',
    fontWeight: '700',
    fontSize: 12,
  },
  selectedCount: {
    color: '#6E6E73',
    fontWeight: '800',
    fontSize: 12,
  },
  emptyText: {
    color: '#6E6E73',
    fontWeight: '600',
    fontSize: 13,
  },
  pillsRow: {
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#38383A',
    backgroundColor: '#1C1C1E',
    borderRadius: 999,
    paddingHorizontal: 8,
    height: 28,
    gap: 6,
  },
  pillText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 11,
  },
  pillRemove: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#38383A',
  },
  pillRemoveText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
});


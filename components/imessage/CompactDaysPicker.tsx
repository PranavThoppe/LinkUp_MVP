import { IconSymbol } from '@/components/ui/icon-symbol';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
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
  const [isPickerActive, setIsPickerActive] = useState(false);

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

  const addIsoDate = (iso: string) => {
    if (selectedSet.has(iso)) return;
    const next = [...selectedDatesIso, iso].sort((a, b) => (a < b ? -1 : 1));
    onChangeSelectedDatesIso(next);
  };

  const removeIsoDate = (iso: string) => {
    onChangeSelectedDatesIso(selectedDatesIso.filter(d => d !== iso));
  };

  const handlePickerChange = (event: DateTimePickerEvent, date?: Date) => {
    if (event.type === 'dismissed') {
      setIsPickerActive(false);
      return;
    }
    if (!date) {
      setIsPickerActive(false);
      return;
    }
    setPendingDate(date);
    if (event.type === 'set') {
      const iso = toISODateLocal(date.getFullYear(), date.getMonth(), date.getDate());
      addIsoDate(iso);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pick Days</Text>

      <View style={styles.middleArea}>
        <Text style={styles.dateSelectorHint}>
          {Platform.OS === 'web' ? 'Type a date, then tap +' : 'Tap to pick a date'}
        </Text>
        <View style={styles.addRow}>
          {Platform.OS === 'web' ? (
            <>
              <TextInput
                value={webDateText}
                onChangeText={setWebDateText}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#5AE88A"
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
                <IconSymbol name="plus.circle.fill" size={22} color={webCanAdd ? '#34C759' : '#38383A'} />
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.pickerInline}>
              <View
                onTouchStart={() => setIsPickerActive(true)}
                style={[styles.pickerShell, isPickerActive && styles.pickerShellActive]}>
                <DateTimePicker
                  mode="date"
                  value={pendingDate}
                  display={Platform.OS === 'ios' ? 'compact' : 'default'}
                  onChange={handlePickerChange}
                  accentColor="green"
                  themeVariant="dark"
                  {...(Platform.OS === 'android' ? { textColor: '#34C759' } : {})}
                />
              </View>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  addIsoDate(pendingIso);
                  setIsPickerActive(false);
                }}
                style={[styles.doneButton, isPickerActive && styles.doneButtonActive]}>
                <Text style={[styles.doneButtonText, isPickerActive && styles.doneButtonTextActive]}>Done</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      <View style={styles.bottomSection}>
        <View style={styles.selectedRow}>
          <Text style={styles.selectedLabel}>Selected</Text>
          <Text style={styles.selectedCount}>{selectedDatesIso.length}</Text>
        </View>

        <View style={styles.selectedContentArea}>
          {selectedDatesIso.length === 0 ? (
            <Text style={styles.emptyText}>Your chosen days appear below.</Text>
          ) : selectedDatesIso.length <= 4 ? (
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
          ) : (
            <ScrollView style={styles.pillsScrollArea} showsVerticalScrollIndicator={false} contentContainerStyle={styles.pillsWrap}>
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
      </View>
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
  middleArea: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  dateSelectorHint: {
    color: '#34C759',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
  },
  addRow: {
    width: '100%',
    maxWidth: 360,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  pickerInline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  pickerShell: {
    borderRadius: 12,
    paddingHorizontal: 8,
    backgroundColor: '#1C1C1E',
  },
  pickerShellActive: {
    backgroundColor: '#1C1C1E',
  },
  doneButton: {
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    backgroundColor: '#3A3A3C',
  },
  doneButtonActive: {
    backgroundColor: '#0A84FF',
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  doneButtonTextActive: {
    color: '#FFFFFF',
  },
  webInputInline: {
    flex: 1,
    minWidth: 0,
    borderWidth: 1,
    borderColor: '#2D5A3D',
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#34C759',
    fontWeight: '700',
    fontSize: 13,
  },
  bottomSection: {
    width: '100%',
  },
  selectedContentArea: {
    minHeight: 35,
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
    color: '#34C759',
    fontWeight: '700',
    fontSize: 12,
  },
  selectedCount: {
    color: '#34C759',
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
  pillsScrollArea: {
    maxHeight: 120,
  },
  pillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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


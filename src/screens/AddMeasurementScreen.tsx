import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput,
  TouchableOpacity, Alert, KeyboardAvoidingView,
  Platform, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { RootStackParamList } from '../navigation/types';
import { Colors, Fonts, FontSizes, Spacing, Radius } from '../constants/theme';
import { useProgressStore } from '../store/userStore';
import { MeasurementType } from '../types';
import Button from '../components/ui/Button';

type Props = NativeStackScreenProps<RootStackParamList, 'AddMeasurement'>;

const MEASUREMENT_OPTIONS: Array<{
  type: MeasurementType;
  label: string;
  unit: string;
  placeholder: string;
}> = [
  { type: 'weight', label: 'Body Weight', unit: 'kg', placeholder: '75.0' },
  { type: 'waist',  label: 'Waist',       unit: 'cm', placeholder: '80' },
  { type: 'chest',  label: 'Chest',       unit: 'cm', placeholder: '100' },
  { type: 'arms',   label: 'Arms',        unit: 'cm', placeholder: '35' },
  { type: 'thighs', label: 'Thighs',      unit: 'cm', placeholder: '55' },
  { type: 'hips',   label: 'Hips',        unit: 'cm', placeholder: '90' },
];

export default function AddMeasurementScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const preselected = (route.params?.type as MeasurementType | undefined) ?? 'weight';
  const [selectedType, setSelectedType] = useState<MeasurementType>(preselected);
  const [value, setValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const { addMeasurement } = useProgressStore();

  const config = MEASUREMENT_OPTIONS.find((o) => o.type === selectedType)
    ?? MEASUREMENT_OPTIONS[0]!;

  const handleSave = async () => {
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) {
      Alert.alert('Invalid value', 'Please enter a valid number.');
      return;
    }

    setIsSaving(true);
    try {
      await addMeasurement(selectedType, num, config.unit);
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', 'Failed to save measurement. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>Log Measurement</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="close" size={22} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Type selector */}
        <Text style={styles.sectionTitle}>Type</Text>
        <View style={styles.typeGrid}>
          {MEASUREMENT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.type}
              onPress={() => setSelectedType(opt.type)}
              style={[
                styles.typeChip,
                selectedType === opt.type && styles.typeChipActive,
              ]}
            >
              <Text
                style={[
                  styles.typeChipText,
                  selectedType === opt.type && styles.typeChipTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Value input */}
        <Text style={styles.sectionTitle}>Value</Text>
        <View style={styles.inputWrap}>
          <TextInput
            value={value}
            onChangeText={setValue}
            keyboardType="decimal-pad"
            placeholder={config.placeholder}
            placeholderTextColor={Colors.textTertiary}
            style={styles.input}
            autoFocus
          />
          <Text style={styles.unitLabel}>{config.unit}</Text>
        </View>

        <Button
          onPress={() => void handleSave()}
          loading={isSaving}
          disabled={!value || isSaving}
          fullWidth
          style={styles.saveBtn}
          icon={<Ionicons name="checkmark" size={16} color="#fff" />}
        >
          Save {config.label}
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  content: { padding: Spacing.lg, gap: 0 },
  sectionTitle: {
    fontFamily: Fonts.body,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 20,
  },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  typeChipActive: {
    borderColor: Colors.purple,
    backgroundColor: Colors.purpleDim,
  },
  typeChipText: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  typeChipTextActive: { color: Colors.purpleLight, fontWeight: '700' },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderHi,
    borderRadius: Radius.xl,
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  input: {
    flex: 1,
    fontFamily: Fonts.display,
    fontSize: 48,
    fontWeight: '700',
    color: Colors.textPrimary,
    paddingVertical: 20,
  },
  unitLabel: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.lg,
    color: Colors.textSecondary,
    fontWeight: '600',
    paddingLeft: 8,
  },
  saveBtn: { borderRadius: Radius.xl },
});

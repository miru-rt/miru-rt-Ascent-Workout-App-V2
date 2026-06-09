import React, { useState, useCallback } from 'react';
import {
  ScrollView, View, Text, StyleSheet,
  TouchableOpacity, Alert, Image, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { RootStackParamList } from '../navigation/types';
import { Colors, Fonts, FontSizes, Spacing, Radius } from '../constants/theme';
import { useProgressStore } from '../store/userStore';
import {
  addProgressPhoto, getProgressPhotos, deleteProgressPhoto,
} from '../database/repositories/measurementRepository';
import { ProgressPhoto, MeasurementType } from '../types';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Tag, SectionLabel } from '../components/ui/SharedUI';
import { BodyweightChart } from '../components/charts/Charts';
import { formatDate } from '../utils/formatters';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const MEASUREMENT_CONFIG: Array<{
  type: MeasurementType;
  label: string;
  unit: string;
  emoji: string;
}> = [
  { type: 'weight', label: 'Weight', unit: 'kg', emoji: '⚖️' },
  { type: 'waist',  label: 'Waist',  unit: 'cm', emoji: '📏' },
  { type: 'chest',  label: 'Chest',  unit: 'cm', emoji: '💪' },
  { type: 'arms',   label: 'Arms',   unit: 'cm', emoji: '💪' },
  { type: 'thighs', label: 'Thighs', unit: 'cm', emoji: '🦵' },
  { type: 'hips',   label: 'Hips',   unit: 'cm', emoji: '📐' },
];

const PHOTO_TYPES = [
  { type: 'front' as const, label: 'Front' },
  { type: 'side'  as const, label: 'Side'  },
  { type: 'back'  as const, label: 'Back'  },
];

export default function ProgressScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();

  const {
    latestMeasurements, bodyweightHistory,
    loadMeasurements, isLoading,
  } = useProgressStore();

  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);

  const load = useCallback(async () => {
    await loadMeasurements();
    const p = await getProgressPhotos();
    setPhotos(p);
  }, [loadMeasurements]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const handleAddPhoto = async (type: 'front' | 'side' | 'back') => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow access to your photo library to add progress photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      const photo = await addProgressPhoto(result.assets[0].uri, type);
      setPhotos((prev) => [photo, ...prev]);
    }
  };

  const handleDeletePhoto = (id: string) => {
    Alert.alert('Delete Photo', 'Are you sure you want to delete this progress photo?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteProgressPhoto(id);
          setPhotos((prev) => prev.filter((p) => p.id !== id));
        },
      },
    ]);
  };

  const bwLabels = bodyweightHistory.slice(-10).map((m) => {
    const d = new Date(m.measuredAt);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  });
  const bwData = bodyweightHistory.slice(-10).map((m) => m.value);
  const latestBW = latestMeasurements.weight;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={load}
          tintColor={Colors.purple}
          colors={[Colors.purple]}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Body Progress</Text>
        <Text style={styles.subtitle}>Track your transformation</Text>
      </View>

      {/* ── Bodyweight ── */}
      <SectionLabel
        right={
          <Button
            variant="ghost"
            size="sm"
            onPress={() => navigation.navigate('AddMeasurement', { type: 'weight' })}
            icon={<Ionicons name="add" size={14} color={Colors.textSecondary} />}
          >
            Log
          </Button>
        }
        style={styles.sectionLabel}
      >
        Bodyweight
      </SectionLabel>
      <Card style={styles.card}>
        <View style={styles.bwTop}>
          <View>
            <Text style={styles.bwValue}>
              {latestBW ? latestBW.value.toFixed(1) : '—'}
              <Text style={styles.bwUnit}> kg</Text>
            </Text>
            {latestBW && (
              <Text style={styles.bwDate}>
                Last logged {formatDate(latestBW.measuredAt)}
              </Text>
            )}
          </View>
          {latestBW && <Tag color={Colors.green}>✓ Tracking</Tag>}
        </View>
        {bwData.length > 1 ? (
          <BodyweightChart labels={bwLabels} data={bwData} height={120} />
        ) : (
          <Text style={styles.hint}>Log your weight regularly to see your trend here.</Text>
        )}
      </Card>

      {/* ── Measurements ── */}
      <SectionLabel
        right={
          <Button
            variant="ghost"
            size="sm"
            onPress={() => navigation.navigate('AddMeasurement', {})}
            icon={<Ionicons name="add" size={14} color={Colors.textSecondary} />}
          >
            Add
          </Button>
        }
        style={styles.sectionLabel}
      >
        Measurements
      </SectionLabel>
      <View style={styles.measureGrid}>
        {MEASUREMENT_CONFIG.map(({ type, label, unit, emoji }) => {
          const m = latestMeasurements[type];
          return (
            <TouchableOpacity
              key={type}
              onPress={() => navigation.navigate('AddMeasurement', { type })}
              activeOpacity={0.75}
            >
              <Card style={styles.measureCard}>
                <Text style={styles.measureEmoji}>{emoji}</Text>
                <Text style={styles.measureLabel}>{label}</Text>
                <Text style={styles.measureValue}>
                  {m ? `${m.value} ${unit}` : '—'}
                </Text>
                {m && (
                  <Text style={styles.measureDate}>{formatDate(m.measuredAt)}</Text>
                )}
              </Card>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Progress Photos ── */}
      <SectionLabel style={styles.sectionLabel}>Progress Photos</SectionLabel>
      <View style={styles.photoRow}>
        {PHOTO_TYPES.map(({ type, label }) => {
          const latestForType = photos.find((p) => p.type === type);
          return (
            <View key={type} style={styles.photoSlot}>
              <TouchableOpacity
                onPress={() => handleAddPhoto(type)}
                onLongPress={() => latestForType && handleDeletePhoto(latestForType.id)}
                style={styles.photoBtn}
                activeOpacity={0.8}
              >
                {latestForType ? (
                  <Image
                    source={{ uri: latestForType.uri }}
                    style={styles.photoImg}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.photoEmpty}>
                    <Ionicons name="add-circle-outline" size={24} color={Colors.textTertiary} />
                  </View>
                )}
              </TouchableOpacity>
              <Text style={styles.photoLabel}>{label}</Text>
              {latestForType && (
                <Text style={styles.photoDate}>{formatDate(latestForType.takenAt)}</Text>
              )}
            </View>
          );
        })}
      </View>
      <Text style={styles.photoHint}>Long-press a photo to delete it.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingHorizontal: Spacing.lg, paddingBottom: 100 },
  header: { marginBottom: Spacing.xl },
  title: {
    fontFamily: Fonts.display,
    fontSize: FontSizes['2xl'],
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: 3,
  },
  sectionLabel: { marginBottom: 10 },
  card: { marginBottom: Spacing.xl },
  bwTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  bwValue: {
    fontFamily: Fonts.display,
    fontSize: FontSizes['3xl'],
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  bwUnit: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: '400',
  },
  bwDate: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    color: Colors.textTertiary,
    marginTop: 3,
  },
  hint: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    color: Colors.textTertiary,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  measureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: Spacing.xl,
  },
  measureCard: {
    width: '100%',
    padding: 14,
  },
  measureEmoji: { fontSize: 18, marginBottom: 6 },
  measureLabel: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  measureValue: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  measureDate: {
    fontFamily: Fonts.body,
    fontSize: 10,
    color: Colors.textTertiary,
    marginTop: 3,
  },
  photoRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  photoSlot: { flex: 1, alignItems: 'center' },
  photoBtn: { width: '100%', aspectRatio: 3 / 4, borderRadius: Radius.lg, overflow: 'hidden' },
  photoImg: { width: '100%', height: '100%' },
  photoEmpty: {
    flex: 1,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoLabel: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginTop: 6,
  },
  photoDate: {
    fontFamily: Fonts.body,
    fontSize: 10,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  photoHint: {
    fontFamily: Fonts.body,
    fontSize: 10,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
});

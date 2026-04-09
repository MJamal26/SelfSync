import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, Image, KeyboardAvoidingView,
  PermissionsAndroid, Platform, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { FoodEntry } from '../types';
import ScreenHeader from '../components/ScreenHeader';
import { useTheme, Theme, spacing, shadow } from '../context/ThemeContext';
import { analyzeFood, FoodAnalysis } from '../config/groq';

const STORAGE_KEY = '@selfsync_calories';
const DAILY_GOAL  = 2000;

function todayStr()   { return new Date().toISOString().slice(0, 10); }
function nowTimeStr() {
  return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

type ScanState =
  | { status: 'idle' }
  | { status: 'scanning' }
  | { status: 'result'; imageUri: string; analysis: FoodAnalysis }
  | { status: 'error'; message: string };

const CONFIDENCE_ICON: Record<FoodAnalysis['confidence'], string> = {
  high:   '✅',
  medium: '⚠️',
  low:    '❓',
};

/** Request CAMERA permission on Android; resolves true if granted. */
async function requestCameraPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.CAMERA,
      {
        title:          'Camera Permission',
        message:        'SelfSync needs camera access to scan your food.',
        buttonPositive: 'Allow',
        buttonNegative: 'Deny',
      },
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
}

/** Request READ_MEDIA_IMAGES (Android 13+) or READ_EXTERNAL_STORAGE for gallery. */
async function requestGalleryPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  try {
    const permission = (Platform.Version as number) >= 33
      ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
      : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;
    const granted = await PermissionsAndroid.request(permission, {
      title:          'Gallery Permission',
      message:        'SelfSync needs gallery access to scan food photos.',
      buttonPositive: 'Allow',
      buttonNegative: 'Deny',
    });
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
}

export default function CalorieTrackerScreen() {
  const { theme } = useTheme();
  const s = makeStyles(theme);

  // ── Data ───────────────────────────────────────────────────────
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const saveEntries = useCallback(async (updated: FoodEntry[]) => {
    try { await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {}
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setEntries(JSON.parse(raw));
      } catch {}
    })();
  }, []);

  // ── Scan state ─────────────────────────────────────────────────
  const [scan,      setScan]      = useState<ScanState>({ status: 'idle' });
  // Editable fields after AI result
  const [editName,  setEditName]  = useState('');
  const [editKcal,  setEditKcal]  = useState('');

  // ── Manual add state ───────────────────────────────────────────
  const [showManual,    setShowManual]    = useState(false);
  const [manualName,    setManualName]    = useState('');
  const [manualCalories,setManualCalories]= useState('');
  const manualKcalRef = useRef<TextInput>(null);

  // ── Derived ────────────────────────────────────────────────────
  const today        = todayStr();
  const todayEntries = entries.filter(e => e.date === today);
  const dailyTotal   = todayEntries.reduce((s, e) => s + e.calories, 0);
  const goalPercent  = Math.min((dailyTotal / DAILY_GOAL) * 100, 100);
  const remaining    = Math.max(DAILY_GOAL - dailyTotal, 0);
  const isOver       = dailyTotal > DAILY_GOAL;

  // ── Scan helpers ───────────────────────────────────────────────
  const processImage = useCallback(async (uri: string, base64: string, mime: string) => {
    setScan({ status: 'scanning' });
    try {
      const analysis = await analyzeFood(base64, mime);
      setEditName(analysis.name);
      setEditKcal(String(analysis.calories));
      setScan({ status: 'result', imageUri: uri, analysis });
    } catch (err: any) {
      const msg: string = err?.message ?? 'Analysis failed';
      if (msg.startsWith('NOT_FOOD:')) {
        // Not a food photo — reset to idle and explain clearly
        setScan({ status: 'idle' });
        Alert.alert(
          '🍽️ No food detected',
          'Point the camera at a meal, snack, or drink.\n\nMake sure the food fills most of the frame.',
          [{ text: 'OK' }],
        );
      } else {
        setScan({ status: 'error', message: msg });
      }
    }
  }, []);

  const openCamera = useCallback(async () => {
    const ok = await requestCameraPermission();
    if (!ok) {
      Alert.alert('Permission denied', 'Camera access is required. Please enable it in Settings → Apps → SelfSync → Permissions.');
      return;
    }
    launchCamera(
      { mediaType: 'photo', includeBase64: true, quality: 0.5, maxWidth: 800, maxHeight: 800 },
      resp => {
        if (resp.didCancel || resp.errorCode) return;
        const asset = resp.assets?.[0];
        if (!asset?.uri || !asset.base64) return;
        processImage(asset.uri, asset.base64, asset.type ?? 'image/jpeg');
      },
    );
  }, [processImage]);

  const openGallery = useCallback(async () => {
    const ok = await requestGalleryPermission();
    if (!ok) {
      Alert.alert('Permission denied', 'Gallery access is required. Please enable it in Settings → Apps → SelfSync → Permissions.');
      return;
    }
    launchImageLibrary(
      { mediaType: 'photo', includeBase64: true, quality: 0.5, maxWidth: 800, maxHeight: 800 },
      resp => {
        if (resp.didCancel || resp.errorCode) return;
        const asset = resp.assets?.[0];
        if (!asset?.uri || !asset.base64) return;
        processImage(asset.uri, asset.base64, asset.type ?? 'image/jpeg');
      },
    );
  }, [processImage]);

  // ── Add entry helpers ──────────────────────────────────────────
  const addFromScan = useCallback(() => {
    const kcal = parseInt(editKcal, 10);
    if (!editName.trim() || isNaN(kcal) || kcal <= 0) {
      Alert.alert('Fix the values before adding'); return;
    }
    const entry: FoodEntry = {
      id: Date.now().toString(), name: editName.trim(),
      calories: kcal, date: today, time: nowTimeStr(),
    };
    const updated = [entry, ...entries];
    setEntries(updated); saveEntries(updated);
    setScan({ status: 'idle' });
  }, [editName, editKcal, entries, today, saveEntries]);

  const addManual = useCallback(() => {
    const kcal = parseInt(manualCalories, 10);
    if (!manualName.trim())                          { Alert.alert('Enter food name'); return; }
    if (!manualCalories.trim() || isNaN(kcal) || kcal <= 0) { Alert.alert('Enter valid calories'); return; }
    const entry: FoodEntry = {
      id: Date.now().toString(), name: manualName.trim(),
      calories: kcal, date: today, time: nowTimeStr(),
    };
    const updated = [entry, ...entries];
    setEntries(updated); saveEntries(updated);
    setManualName(''); setManualCalories('');
  }, [manualName, manualCalories, entries, today, saveEntries]);

  const deleteEntry = useCallback((id: string) => {
    Alert.alert('Remove entry', 'Delete this entry?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
        const updated = entries.filter(e => e.id !== id);
        setEntries(updated); saveEntries(updated);
      }},
    ]);
  }, [entries, saveEntries]);

  // ── Render ─────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.container}>
      <ScreenHeader title="Calorie Tracker" icon="nutrition-outline" iconColor={theme.positive} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <FlatList
          data={todayEntries}
          keyExtractor={e => e.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.list}
          ListHeaderComponent={
            <>
              {/* ── Daily summary ─────────────────────────── */}
              <View style={s.summaryCard}>
                <View style={s.summaryRow}>
                  <View>
                    <Text style={s.summaryLabel}>Today's Intake</Text>
                    <View style={s.summaryNumbers}>
                      <Text style={[s.summaryTotal, isOver && { color: theme.danger }]}>{dailyTotal}</Text>
                      <Text style={s.summaryGoal}> / {DAILY_GOAL} kcal</Text>
                    </View>
                  </View>
                  <View style={s.remainingBox}>
                    <Text style={[s.remainingNum, { color: isOver ? theme.danger : theme.positive }]}>
                      {isOver ? '+' + (dailyTotal - DAILY_GOAL) : remaining}
                    </Text>
                    <Text style={s.remainingLabel}>{isOver ? 'over goal' : 'remaining'}</Text>
                  </View>
                </View>
                <View style={s.progressTrack}>
                  <View style={[s.progressFill,
                    { width: `${goalPercent}%` },
                    isOver && { backgroundColor: theme.danger },
                  ]} />
                </View>
                <Text style={s.goalLabel}>
                  {isOver ? '⚠️ Daily goal exceeded!' : `${Math.round(goalPercent)}% of daily goal`}
                </Text>
              </View>

              {/* ── AI Scan card ───────────────────────────── */}
              <View style={s.scanCard}>
                <Text style={s.scanCardTitle}>📷 Scan Your Food</Text>
                <Text style={s.scanCardHint}>Take a photo — AI will identify the food and estimate calories</Text>

                {scan.status === 'idle' && (
                  <View style={s.scanBtnRow}>
                    <TouchableOpacity style={[s.scanBtn, { backgroundColor: theme.accent }]} onPress={openCamera}>
                      <Ionicons name="camera-outline" size={22} color="#FFF" />
                      <Text style={s.scanBtnText}>Camera</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[s.scanBtn, { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border }]} onPress={openGallery}>
                      <Ionicons name="images-outline" size={22} color={theme.accent} />
                      <Text style={[s.scanBtnText, { color: theme.accent }]}>Gallery</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {scan.status === 'scanning' && (
                  <View style={s.scanLoading}>
                    <ActivityIndicator color={theme.accent} size="large" />
                    <Text style={s.scanLoadingText}>Analyzing food with AI…</Text>
                  </View>
                )}

                {scan.status === 'error' && (
                  <View style={s.scanError}>
                    <Text style={s.scanErrorText}>❌ {scan.message}</Text>
                    <TouchableOpacity onPress={() => setScan({ status: 'idle' })}>
                      <Text style={[s.scanRetryText, { color: theme.accent }]}>Try again</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {scan.status === 'result' && (
                  <View style={s.resultArea}>
                    {/* Food image thumbnail */}
                    <Image source={{ uri: scan.imageUri }} style={s.foodThumb} resizeMode="cover" />

                    {/* AI result + editable fields */}
                    <View style={s.resultCard}>
                      <Text style={s.resultConfidence}>
                        {CONFIDENCE_ICON[scan.analysis.confidence]} AI confidence: {scan.analysis.confidence}
                      </Text>

                      <Text style={s.resultFieldLabel}>Food name</Text>
                      <TextInput
                        style={s.resultInput}
                        value={editName}
                        onChangeText={setEditName}
                        placeholder="Food name"
                        placeholderTextColor={theme.textMuted}
                      />

                      {/* Ingredients detected */}
                      {scan.analysis.ingredients?.length > 0 && (
                        <View style={s.ingredientsRow}>
                          {scan.analysis.ingredients.map((ing, i) => (
                            <View key={i} style={s.ingredientChip}>
                              <Text style={s.ingredientChipText}>{ing}</Text>
                            </View>
                          ))}
                        </View>
                      )}

                      {/* AI portion note */}
                      {!!scan.analysis.note && (
                        <Text style={s.resultNote}>📏 {scan.analysis.note}</Text>
                      )}

                      <Text style={s.resultFieldLabel}>Estimated calories</Text>
                      <TextInput
                        style={s.resultInput}
                        value={editKcal}
                        onChangeText={setEditKcal}
                        keyboardType="number-pad"
                        placeholder="kcal"
                        placeholderTextColor={theme.textMuted}
                      />

                      <View style={s.resultBtnRow}>
                        <TouchableOpacity style={s.resultBtnSecondary} onPress={() => setScan({ status: 'idle' })}>
                          <Text style={[s.resultBtnSecondaryText, { color: theme.textSecondary }]}>✕ Discard</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[s.resultBtnPrimary, { backgroundColor: theme.accent }]} onPress={addFromScan}>
                          <Text style={s.resultBtnPrimaryText}>＋ Add to log</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                )}
              </View>

              {/* ── Manual entry (collapsible) ─────────────── */}
              <TouchableOpacity style={s.manualToggle} onPress={() => setShowManual(p => !p)}>
                <Ionicons name={showManual ? 'chevron-up' : 'chevron-down'} size={16} color={theme.textMuted} />
                <Text style={s.manualToggleText}>Add manually</Text>
              </TouchableOpacity>

              {showManual && (
                <View style={s.manualCard}>
                  <View style={s.inputRow}>
                    <TextInput
                      style={[s.input, { flex: 1 }]}
                      placeholder="Food name"
                      placeholderTextColor={theme.textMuted}
                      value={manualName}
                      onChangeText={setManualName}
                      returnKeyType="next"
                      onSubmitEditing={() => manualKcalRef.current?.focus()}
                    />
                    <TextInput
                      ref={manualKcalRef}
                      style={[s.input, s.inputCal]}
                      placeholder="kcal"
                      placeholderTextColor={theme.textMuted}
                      value={manualCalories}
                      onChangeText={setManualCalories}
                      keyboardType="number-pad"
                      returnKeyType="done"
                      onSubmitEditing={addManual}
                    />
                    <TouchableOpacity style={s.addButton} onPress={addManual}>
                      <Text style={s.addButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* ── List header ───────────────────────────── */}
              <View style={s.listHeader}>
                <Text style={s.listTitle}>Today's Log</Text>
                <Text style={s.listCount}>{todayEntries.length} items</Text>
              </View>
            </>
          }
          ListEmptyComponent={
            <View style={s.emptyContainer}>
              <Text style={s.emptyEmoji}>🥗</Text>
              <Text style={s.emptyText}>No meals logged yet.</Text>
              <Text style={s.emptyHint}>Scan a food photo above to get started.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={s.entryRow} onLongPress={() => deleteEntry(item.id)} activeOpacity={0.8}>
              <View style={s.entryLeft}>
                <Text style={s.entryName}>{item.name}</Text>
                <Text style={s.entryTime}>{item.time}</Text>
              </View>
              <View style={s.calBadge}>
                <Text style={s.calBadgeText}>{item.calories}</Text>
                <Text style={s.calLabel}>kcal</Text>
              </View>
            </TouchableOpacity>
          )}
        />
        <Text style={s.hint}>Long-press an entry to delete it.</Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

function makeStyles(theme: Theme) {
  const cardShadow = theme.dark ? {} : shadow.card;
  return StyleSheet.create({
    container:    { flex: 1, backgroundColor: theme.bg },
    list:         { paddingHorizontal: spacing.md, paddingBottom: 40 },

    /* Summary */
    summaryCard:    { marginBottom: spacing.md, marginTop: spacing.sm, backgroundColor: theme.card, borderRadius: 18, padding: 20, borderWidth: 1, borderColor: theme.border, ...cardShadow },
    summaryRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
    summaryLabel:   { fontSize: 13, color: theme.textSecondary, fontWeight: '600', marginBottom: spacing.xs },
    summaryNumbers: { flexDirection: 'row', alignItems: 'baseline' },
    summaryTotal:   { fontSize: 32, fontWeight: '800', color: theme.accent },
    summaryGoal:    { fontSize: 14, color: theme.textSecondary, fontWeight: '500' },
    remainingBox:   { backgroundColor: theme.bg, borderRadius: 12, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2, alignItems: 'center' },
    remainingNum:   { fontSize: 22, fontWeight: '800' },
    remainingLabel: { fontSize: 11, color: theme.textSecondary, fontWeight: '500', marginTop: spacing.xs },
    progressTrack:  { height: 8, backgroundColor: theme.bgSubtle, borderRadius: 4, overflow: 'hidden', marginBottom: spacing.xs },
    progressFill:   { height: '100%', backgroundColor: theme.accent, borderRadius: 4 },
    goalLabel:      { fontSize: 12, color: theme.textSecondary, fontWeight: '500' },

    /* Scan card */
    scanCard:       { backgroundColor: theme.card, borderRadius: 18, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: theme.border, ...cardShadow },
    scanCardTitle:  { fontSize: 16, fontWeight: '700', color: theme.text, marginBottom: 4 },
    scanCardHint:   { fontSize: 12, color: theme.textMuted, marginBottom: spacing.md },
    scanBtnRow:     { flexDirection: 'row', gap: spacing.sm },
    scanBtn:        { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14 },
    scanBtnText:    { fontSize: 14, fontWeight: '700', color: '#FFF' },
    scanLoading:    { alignItems: 'center', paddingVertical: spacing.lg },
    scanLoadingText:{ marginTop: spacing.sm, fontSize: 14, color: theme.textSecondary, fontWeight: '500' },
    scanError:      { alignItems: 'center', paddingVertical: spacing.md },
    scanErrorText:  { fontSize: 14, color: theme.danger, marginBottom: spacing.sm, textAlign: 'center' },
    scanRetryText:  { fontSize: 13, fontWeight: '600' },

    /* Result */
    resultArea:         { marginTop: spacing.sm },
    foodThumb:          { width: '100%', height: 180, borderRadius: 12, marginBottom: spacing.sm },
    resultCard:         { backgroundColor: theme.bg, borderRadius: 14, padding: spacing.md, borderWidth: 1, borderColor: theme.border },
    resultConfidence:   { fontSize: 12, color: theme.textMuted, marginBottom: spacing.md, fontWeight: '500' },
    resultFieldLabel:   { fontSize: 11, fontWeight: '700', color: theme.textMuted, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: spacing.xs },
    resultInput:        { backgroundColor: theme.card, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12, color: theme.text, fontSize: 15, fontWeight: '600', borderWidth: 1, borderColor: theme.border, marginBottom: spacing.sm },
    resultBtnRow:       { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
    resultBtnPrimary:   { flex: 2, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
    resultBtnPrimaryText:{ color: '#FFF', fontWeight: '700', fontSize: 14 },
    resultBtnSecondary: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: theme.bgSubtle },
    resultBtnSecondaryText: { fontWeight: '600', fontSize: 13 },
    ingredientsRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: spacing.sm },
    ingredientChip:     { backgroundColor: theme.accent + '22', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: theme.accent + '44' },
    ingredientChipText: { fontSize: 11, color: theme.accent, fontWeight: '600' },
    resultNote:         { fontSize: 11, color: theme.textMuted, fontStyle: 'italic', marginBottom: spacing.sm, lineHeight: 16 },

    /* Manual add */
    manualToggle:       { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'center', paddingVertical: 8, marginBottom: spacing.xs },
    manualToggleText:   { fontSize: 13, color: theme.textMuted, fontWeight: '500' },
    manualCard:         { backgroundColor: theme.card, borderRadius: 14, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: theme.border },
    inputRow:           { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
    input:              { backgroundColor: theme.bg, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 12, color: theme.text, fontSize: 14, borderWidth: 1, borderColor: theme.border },
    inputCal:           { width: 80 },
    addButton:          { backgroundColor: theme.accent, borderRadius: 10, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    addButtonText:      { color: '#FFF', fontSize: 24, fontWeight: '300', lineHeight: 28 },

    /* List */
    listHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm, marginTop: spacing.sm },
    listTitle:      { fontSize: 15, fontWeight: '700', color: theme.text },
    listCount:      { fontSize: 13, color: theme.textSecondary },
    entryRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.card, borderRadius: 14, paddingVertical: 14, paddingHorizontal: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: theme.border, ...cardShadow },
    entryLeft:      { flex: 1 },
    entryName:      { fontSize: 15, fontWeight: '600', color: theme.text, marginBottom: spacing.xs },
    entryTime:      { fontSize: 12, color: theme.textSecondary },
    calBadge:       { alignItems: 'center', marginLeft: spacing.md },
    calBadgeText:   { fontSize: 20, fontWeight: '800', color: theme.accent },
    calLabel:       { fontSize: 10, color: theme.textSecondary, fontWeight: '600' },
    emptyContainer: { alignItems: 'center', marginTop: spacing.xl },
    emptyEmoji:     { fontSize: 48, marginBottom: spacing.md },
    emptyText:      { fontSize: 17, fontWeight: '600', color: theme.textSecondary, marginBottom: spacing.xs },
    emptyHint:      { fontSize: 13, color: theme.textMuted },
    hint:           { textAlign: 'center', fontSize: 11, color: theme.textMuted, paddingBottom: spacing.md },
  });
}

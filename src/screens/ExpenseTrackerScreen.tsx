import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert, FlatList, KeyboardAvoidingView, Platform,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Expense, ExpenseCategory } from '../types';
import ScreenHeader from '../components/ScreenHeader';
import { useTheme, Theme, shadow, spacing } from '../context/ThemeContext';

const STORAGE_KEY        = '@selfsync_expenses';
const INCOME_STORAGE_KEY = '@selfsync_income';

const CATEGORIES: { key: ExpenseCategory; label: string; emoji: string; color: string }[] = [
  { key: 'food',     label: 'Food',     emoji: '🍔', color: '#F59E0B' },
  { key: 'travel',   label: 'Travel',   emoji: '✈️',  color: '#6366F1' },
  { key: 'personal', label: 'Personal', emoji: '🛍️', color: '#EC4899' },
];

function todayStr()           { return new Date().toISOString().slice(0, 10); }
function monthStr()           { return new Date().toISOString().slice(0, 7);  }
function fmt(n: number)       { return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`; }
function daysInCurrentMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
}
function budgetColor(pct: number): string {
  if (pct < 50) return '#22C55E';
  if (pct < 80) return '#F97316';
  return '#EF4444';
}

export default function ExpenseTrackerScreen() {
  const { theme } = useTheme();
  const s = makeStyles(theme);

  // ── State ────────────────────────────────────────────────────────
  const [expenses,      setExpenses]      = useState<Expense[]>([]);
  const [description,   setDescription]   = useState('');
  const [amount,        setAmount]        = useState('');
  const [category,      setCategory]      = useState<ExpenseCategory>('food');
  const [activeTab,     setActiveTab]     = useState<'daily' | 'monthly'>('monthly');
  const [income,        setIncome]        = useState<number>(0);
  const [incomeInput,   setIncomeInput]   = useState('');
  const [editingIncome, setEditingIncome] = useState(false);
  const incomeRef = useRef<TextInput>(null);
  const amountRef = useRef<TextInput>(null);

  // ── Load ─────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [expRaw, incRaw] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem(INCOME_STORAGE_KEY),
        ]);
        if (expRaw) setExpenses(JSON.parse(expRaw));
        if (incRaw) {
          const saved = parseFloat(incRaw);
          if (!isNaN(saved)) setIncome(saved);
        }
      } catch {}
    })();
  }, []);

  // ── Persist ──────────────────────────────────────────────────────
  const saveExpenses = useCallback(async (updated: Expense[]) => {
    try { await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {}
  }, []);

  const saveIncome = useCallback(async (val: number) => {
    try { await AsyncStorage.setItem(INCOME_STORAGE_KEY, String(val)); } catch {}
  }, []);

  // ── Income actions ───────────────────────────────────────────────
  const startEditIncome = () => {
    setIncomeInput(income > 0 ? String(income) : '');
    setEditingIncome(true);
    setTimeout(() => incomeRef.current?.focus(), 100);
  };

  const confirmIncome = () => {
    const val = parseFloat(incomeInput);
    if (isNaN(val) || val <= 0) { Alert.alert('Enter a valid income amount'); return; }
    setIncome(val);
    saveIncome(val);
    setEditingIncome(false);
  };

  // ── Expense actions ──────────────────────────────────────────────
  const addExpense = useCallback(() => {
    const amt = parseFloat(amount);
    if (!description.trim())                      { Alert.alert('Missing description'); return; }
    if (!amount.trim() || isNaN(amt) || amt <= 0) { Alert.alert('Invalid amount'); return; }
    const entry: Expense = {
      id: Date.now().toString(), description: description.trim(),
      amount: amt, category, date: todayStr(), month: monthStr(),
    };
    const updated = [entry, ...expenses];
    setExpenses(updated); saveExpenses(updated);
    setDescription(''); setAmount('');
  }, [description, amount, category, expenses, saveExpenses]);

  const deleteExpense = useCallback((id: string) => {
    Alert.alert('Delete expense', 'Remove this entry?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
        const updated = expenses.filter(e => e.id !== id);
        setExpenses(updated); saveExpenses(updated);
      }},
    ]);
  }, [expenses, saveExpenses]);

  // ── Derived values ───────────────────────────────────────────────
  const today    = todayStr();
  const month    = monthStr();
  const filtered = activeTab === 'daily'
    ? expenses.filter(e => e.date === today)
    : expenses.filter(e => e.month === month);
  const totalSpent = filtered.reduce((x, e) => x + e.amount, 0);
  const budget     = activeTab === 'monthly'
    ? income
    : income > 0 ? income / daysInCurrentMonth() : 0;
  const remaining  = budget - totalSpent;
  const pctUsed    = budget > 0 ? Math.min((totalSpent / budget) * 100, 100) : 0;
  const barColor   = budgetColor(pctUsed);
  const isOver     = budget > 0 && totalSpent > budget;
  const breakdown  = CATEGORIES.map(cat => ({
    ...cat, total: filtered.filter(e => e.category === cat.key).reduce((x, e) => x + e.amount, 0),
  }));
  const catMeta = (key: ExpenseCategory) => CATEGORIES.find(c => c.key === key)!;

  // ── Render ───────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.container}>
      <ScreenHeader title="Expense Tracker" icon="wallet-outline" iconColor={theme.warning} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>

        {/*
          KEY FIX: FlatList owns the ENTIRE scroll area.
          All "header" cards live inside ListHeaderComponent so they scroll together
          with the expense entries. style={{ flex: 1 }} gives it the remaining height.
        */}
        <FlatList
          data={filtered}
          keyExtractor={e => e.id}
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
          contentContainerStyle={s.list}
          keyboardShouldPersistTaps="handled"

          ListHeaderComponent={
            <>
              {/* ── Income card ──────────────────────────────── */}
              <View style={s.incomeCard}>
                <View style={s.incomeRow}>
                  <View style={s.incomeLabelRow}>
                    <Ionicons name="cash-outline" size={18} color={theme.positive} style={{ marginRight: 6 }} />
                    <Text style={s.incomeLabel}>Monthly Income</Text>
                  </View>

                  {editingIncome ? (
                    <View style={s.incomeEditRow}>
                      <TextInput
                        ref={incomeRef}
                        style={s.incomeInput}
                        value={incomeInput}
                        onChangeText={setIncomeInput}
                        placeholder="₹ 0"
                        placeholderTextColor={theme.textMuted}
                        keyboardType="decimal-pad"
                        returnKeyType="done"
                        onSubmitEditing={confirmIncome}
                      />
                      <TouchableOpacity style={s.incomeConfirmBtn} onPress={confirmIncome}>
                        <Ionicons name="checkmark" size={18} color="#FFF" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity style={s.incomeValueRow} onPress={startEditIncome}>
                      <Text style={[s.incomeValue, income === 0 && s.incomePlaceholder]}>
                        {income > 0 ? fmt(income) : 'Tap to set'}
                      </Text>
                      <Ionicons name="pencil-outline" size={14} color={theme.textMuted} style={{ marginLeft: 6 }} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* ── Tabs ─────────────────────────────────────── */}
              <View style={s.tabRow}>
                {(['daily', 'monthly'] as const).map(tab => (
                  <TouchableOpacity key={tab}
                    style={[s.tab, activeTab === tab && s.tabActive]}
                    onPress={() => setActiveTab(tab)}>
                    <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>
                      {tab === 'daily' ? 'Today' : 'This Month'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* ── Summary card ─────────────────────────────── */}
              <View style={s.summaryCard}>
                <View style={s.summaryTopRow}>
                  <View style={s.summaryBlock}>
                    <Text style={s.summaryBlockLabel}>
                      {activeTab === 'daily' ? "Today's Spending" : 'Monthly Spending'}
                    </Text>
                    <Text style={[s.summaryTotal, isOver && { color: '#EF4444' }]}>{fmt(totalSpent)}</Text>
                  </View>
                  {budget > 0 && (
                    <View style={[s.summaryBlock, s.summaryBlockRight]}>
                      <Text style={s.summaryBlockLabel}>Remaining</Text>
                      <Text style={[s.summaryTotal, { color: isOver ? '#EF4444' : theme.positive }]}>
                        {isOver ? `-${fmt(Math.abs(remaining))}` : fmt(remaining)}
                      </Text>
                    </View>
                  )}
                </View>

                {budget > 0 && (
                  <>
                    <View style={s.progressTrack}>
                      <View style={[s.progressFill, { width: `${pctUsed}%`, backgroundColor: barColor }]} />
                    </View>
                    <Text style={[s.progressLabel, { color: barColor }]}>
                      {Math.round(pctUsed)}% of{activeTab === 'monthly' ? ' monthly' : " today's"} budget used
                      {isOver ? ' — Over budget! 🚨' : ''}
                    </Text>
                  </>
                )}

                {budget === 0 && (
                  <TouchableOpacity style={s.setIncomeNudge} onPress={startEditIncome}>
                    <Text style={s.setIncomeNudgeText}>💡 Set your income to track remaining balance</Text>
                  </TouchableOpacity>
                )}

                <View style={s.breakdownRow}>
                  {breakdown.map(cat => (
                    <View key={cat.key} style={s.catChip}>
                      <Text style={s.catEmoji}>{cat.emoji}</Text>
                      <Text style={[s.catTotal, { color: cat.color }]}>{fmt(cat.total)}</Text>
                      <Text style={s.catLabel}>{cat.label}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* ── Add Expense form ──────────────────────────── */}
              <View style={s.formCard}>
                <Text style={s.formHeading}>Add Expense</Text>
                <View style={s.catRow}>
                  {CATEGORIES.map(cat => (
                    <TouchableOpacity key={cat.key}
                      style={[s.catBtn, category === cat.key && { borderColor: cat.color, backgroundColor: cat.color + '22' }]}
                      onPress={() => setCategory(cat.key)}>
                      <Text style={s.catBtnEmoji}>{cat.emoji}</Text>
                      <Text style={[s.catBtnLabel, category === cat.key && { color: cat.color }]}>{cat.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={s.inputRow}>
                  <TextInput style={[s.input, { flex: 1 }]} placeholder="Description"
                    placeholderTextColor={theme.textMuted} value={description} onChangeText={setDescription}
                    returnKeyType="next" onSubmitEditing={() => amountRef.current?.focus()} />
                  <TextInput ref={amountRef} style={[s.input, s.amountInput]} placeholder="₹ Amount"
                    placeholderTextColor={theme.textMuted} value={amount} onChangeText={setAmount}
                    keyboardType="decimal-pad" returnKeyType="done" onSubmitEditing={addExpense} />
                  <TouchableOpacity style={s.addBtn} onPress={addExpense} activeOpacity={0.85}>
                    <Text style={s.addBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* ── List heading ──────────────────────────────── */}
              <View style={s.listHeader}>
                <Text style={s.listTitle}>
                  {activeTab === 'daily' ? "Today's entries" : "This month's entries"}
                </Text>
                <Text style={s.listCount}>{filtered.length} items</Text>
              </View>
            </>
          }

          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyEmoji}>💸</Text>
              <Text style={s.emptyText}>No expenses yet.</Text>
            </View>
          }

          ListFooterComponent={
            <Text style={s.hint}>Long-press to delete</Text>
          }

          renderItem={({ item }) => {
            const meta = catMeta(item.category);
            return (
              <TouchableOpacity style={s.row} onLongPress={() => deleteExpense(item.id)} activeOpacity={0.8}>
                <View style={[s.catDot, { backgroundColor: meta.color }]}>
                  <Text style={s.catDotEmoji}>{meta.emoji}</Text>
                </View>
                <View style={s.rowMid}>
                  <Text style={s.rowDesc}>{item.description}</Text>
                  <Text style={s.rowMeta}>{meta.label}  ·  {item.date}</Text>
                </View>
                <Text style={[s.rowAmt, { color: meta.color }]}>{fmt(item.amount)}</Text>
              </TouchableOpacity>
            );
          }}
        />

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

function makeStyles(theme: Theme) {
  const cardShadow = theme.dark ? {} : shadow.card;
  return StyleSheet.create({
    container:         { flex: 1, backgroundColor: theme.bg },
    list:              { paddingHorizontal: spacing.md, paddingBottom: 32 },

    /* Income card */
    incomeCard:        { marginTop: spacing.sm, marginBottom: spacing.sm, backgroundColor: theme.card, borderRadius: 16, paddingHorizontal: spacing.md, paddingVertical: 14, borderWidth: 1, borderColor: theme.border, ...cardShadow },
    incomeRow:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    incomeLabelRow:    { flexDirection: 'row', alignItems: 'center' },
    incomeLabel:       { fontSize: 13, fontWeight: '600', color: theme.textSecondary },
    incomeValueRow:    { flexDirection: 'row', alignItems: 'center' },
    incomeValue:       { fontSize: 18, fontWeight: '800', color: theme.positive },
    incomePlaceholder: { color: theme.textMuted, fontSize: 14, fontWeight: '500' },
    incomeEditRow:     { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    incomeInput:       { backgroundColor: theme.bg, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12, color: theme.text, fontSize: 16, fontWeight: '700', borderWidth: 1, borderColor: theme.border, minWidth: 100 },
    incomeConfirmBtn:  { backgroundColor: theme.positive, borderRadius: 10, width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },

    /* Tabs */
    tabRow:        { flexDirection: 'row', marginBottom: spacing.sm, gap: spacing.sm },
    tab:           { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: theme.card, alignItems: 'center', borderWidth: 1, borderColor: theme.border },
    tabActive:     { backgroundColor: theme.accent, borderColor: theme.accent },
    tabText:       { color: theme.textSecondary, fontWeight: '600', fontSize: 14 },
    tabTextActive: { color: '#FFF' },

    /* Summary card */
    summaryCard:       { marginBottom: spacing.sm, backgroundColor: theme.card, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: theme.border, ...cardShadow },
    summaryTopRow:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
    summaryBlock:      { flex: 1 },
    summaryBlockRight: { alignItems: 'flex-end' },
    summaryBlockLabel: { fontSize: 12, color: theme.textSecondary, fontWeight: '600', marginBottom: spacing.xs },
    summaryTotal:      { fontSize: 28, fontWeight: '800', color: theme.text },
    progressTrack:     { height: 8, backgroundColor: theme.bgSubtle, borderRadius: 4, overflow: 'hidden', marginBottom: spacing.xs },
    progressFill:      { height: '100%', borderRadius: 4 },
    progressLabel:     { fontSize: 11, fontWeight: '600', marginBottom: spacing.md },
    setIncomeNudge:    { backgroundColor: theme.bgSubtle, borderRadius: 10, padding: spacing.sm, marginBottom: spacing.sm, alignItems: 'center' },
    setIncomeNudgeText:{ fontSize: 12, color: theme.textMuted, textAlign: 'center' },
    breakdownRow:      { flexDirection: 'row', gap: spacing.sm },
    catChip:           { flex: 1, backgroundColor: theme.bg, borderRadius: 10, padding: spacing.sm + 2, alignItems: 'center', gap: spacing.xs },
    catEmoji:          { fontSize: 18 },
    catTotal:          { fontSize: 13, fontWeight: '700' },
    catLabel:          { fontSize: 10, color: theme.textSecondary, fontWeight: '500' },

    /* Add form */
    formCard:    { marginBottom: spacing.sm, backgroundColor: theme.card, borderRadius: 18, padding: spacing.md, borderWidth: 1, borderColor: theme.border, ...cardShadow },
    formHeading: { fontSize: 13, color: theme.textSecondary, fontWeight: '600', marginBottom: spacing.sm + 2 },
    catRow:      { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm + 2 },
    catBtn:      { flex: 1, paddingVertical: spacing.sm, borderRadius: 10, alignItems: 'center', borderWidth: 1.5, borderColor: theme.border, backgroundColor: theme.bg, gap: spacing.xs },
    catBtnEmoji: { fontSize: 16 },
    catBtnLabel: { fontSize: 11, color: theme.textSecondary, fontWeight: '600' },
    inputRow:    { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
    input:       { backgroundColor: theme.bg, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 12, color: theme.text, fontSize: 14, borderWidth: 1, borderColor: theme.border },
    amountInput: { width: 100 },
    addBtn:      { backgroundColor: theme.accent, borderRadius: 10, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    addBtnText:  { color: '#FFF', fontSize: 24, fontWeight: '300', lineHeight: 28 },

    /* List */
    listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm + 2 },
    listTitle:  { fontSize: 14, fontWeight: '700', color: theme.text },
    listCount:  { fontSize: 12, color: theme.textSecondary },
    row:        { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: theme.card, borderRadius: 16, padding: 14, marginBottom: spacing.md - spacing.xs, borderWidth: 1, borderColor: theme.border, ...cardShadow },
    catDot:     { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    catDotEmoji:{ fontSize: 20 },
    rowMid:     { flex: 1 },
    rowDesc:    { fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: spacing.xs },
    rowMeta:    { fontSize: 11, color: theme.textSecondary },
    rowAmt:     { fontSize: 16, fontWeight: '800' },
    empty:      { alignItems: 'center', marginTop: spacing.xl },
    emptyEmoji: { fontSize: 42, marginBottom: spacing.md },
    emptyText:  { fontSize: 15, color: theme.textSecondary },
    hint:       { textAlign: 'center', fontSize: 11, color: theme.textMuted, paddingVertical: spacing.md },
  });
}

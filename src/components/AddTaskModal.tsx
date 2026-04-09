import React, { useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useTheme, Theme } from '../context/ThemeContext';

interface Props {
  visible: boolean;
  onAdd: (title: string, time: string) => void;
  onCancel: () => void;
}

export default function AddTaskModal({ visible, onAdd, onCancel }: Props) {
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const [title, setTitle] = useState('');
  const [time, setTime]   = useState('');

  const handleAdd = () => {
    if (!title.trim() || !time.trim()) return;
    onAdd(title.trim(), time.trim());
    setTitle('');
    setTime('');
  };

  const handleCancel = () => {
    setTitle('');
    setTime('');
    onCancel();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleCancel}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.overlay}>
        <View style={s.sheet}>
          <View style={s.handle} />
          <Text style={s.heading}>New Task</Text>

          <Text style={s.label}>Task Title</Text>
          <TextInput
            style={s.input}
            placeholder="e.g. Morning workout"
            placeholderTextColor={theme.textMuted}
            value={title}
            onChangeText={setTitle}
            returnKeyType="next"
          />

          <Text style={s.label}>Time</Text>
          <TextInput
            style={s.input}
            placeholder="e.g. 07:00 AM"
            placeholderTextColor={theme.textMuted}
            value={time}
            onChangeText={setTime}
            returnKeyType="done"
            onSubmitEditing={handleAdd}
          />

          <View style={s.actions}>
            <TouchableOpacity style={s.cancelButton} onPress={handleCancel} activeOpacity={0.8}>
              <Text style={s.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.addButton, (!title.trim() || !time.trim()) && s.addButtonDisabled]}
              onPress={handleAdd}
              activeOpacity={0.85}
              disabled={!title.trim() || !time.trim()}
            >
              <Text style={s.addText}>Add Task</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.55)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: theme.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 24,
      paddingBottom: 36,
      paddingTop: 16,
      borderTopWidth: 1,
      borderColor: theme.border,
    },
    handle: {
      width: 40,
      height: 4,
      backgroundColor: theme.border,
      borderRadius: 4,
      alignSelf: 'center',
      marginBottom: 20,
    },
    heading: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 20,
    },
    label: {
      fontSize: 13,
      color: theme.textSecondary,
      fontWeight: '600',
      marginBottom: 6,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    input: {
      backgroundColor: theme.bg,
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 16,
      color: theme.text,
      fontSize: 15,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.border,
    },
    actions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 8,
    },
    cancelButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: theme.bg,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.border,
    },
    cancelText: {
      color: theme.textSecondary,
      fontSize: 15,
      fontWeight: '600',
    },
    addButton: {
      flex: 2,
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: theme.accent,
      alignItems: 'center',
    },
    addButtonDisabled: {
      opacity: 0.4,
    },
    addText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '700',
    },
  });
}

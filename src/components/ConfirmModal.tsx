import React from 'react';
import { View } from 'react-native';
import { AlertTriangle, Trash2, X } from 'lucide-react-native';

import { ic, tw } from '../lib/tw';
import { Btn, Overlay, Text } from './ui';

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Evet, Sil',
  cancelText = 'Vazgeç',
  danger = true,
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <Overlay onClose={onClose} position="center">
      <View
        accessibilityRole="alert"
        style={tw`bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full self-center p-5 shadow-2xl border border-slate-100 dark:border-slate-800`}
      >
        <Btn
          onPress={onClose}
          accessibilityLabel="Kapat"
          className="absolute top-4 right-4 p-1.5 rounded-full z-10"
        >
          <X {...ic('w-4 h-4 text-slate-400')} />
        </Btn>

        <View style={tw`flex-row items-center gap-3 mb-3`}>
          <View
            style={tw.style(
              'w-10 h-10 rounded-2xl items-center justify-center shrink-0 border',
              danger
                ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-100 dark:border-rose-900/50'
                : 'bg-amber-50 dark:bg-amber-950/60 border-amber-100 dark:border-amber-900/50',
            )}
          >
            {danger ? (
              <Trash2 {...ic('w-5 h-5 text-rose-600 dark:text-rose-400')} />
            ) : (
              <AlertTriangle {...ic('w-5 h-5 text-amber-600 dark:text-amber-400')} />
            )}
          </View>
          <View style={tw`min-w-0 flex-1 pr-6`}>
            <Text className="font-bold text-slate-900 dark:text-white text-base leading-tight">{title}</Text>
            <Text className="text-xs text-slate-500 dark:text-slate-400 font-medium">Bu işlem geri alınamaz</Text>
          </View>
        </View>

        <View
          style={tw`mb-5 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-800`}
        >
          {typeof message === 'string' ? (
            <Text className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{message}</Text>
          ) : (
            message
          )}
        </View>

        <View style={tw`flex-row items-center justify-end gap-2.5`}>
          <Btn onPress={onClose} className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <Text className="text-xs font-semibold text-slate-700 dark:text-slate-300">{cancelText}</Text>
          </Btn>
          <Btn
            onPress={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2.5 rounded-xl shadow-sm flex-row items-center gap-1.5 ${
              danger ? 'bg-rose-600' : 'bg-amber-600'
            }`}
          >
            {danger && <Trash2 {...ic('w-3.5 h-3.5 text-white')} />}
            <Text className="text-xs font-bold text-white">{confirmText}</Text>
          </Btn>
        </View>
      </View>
    </Overlay>
  );
};

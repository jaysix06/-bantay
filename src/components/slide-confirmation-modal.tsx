import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/theme/theme-provider';
import { AppButton } from './app-button';
import { AppModal } from './app-modal';
import { SlideToConfirm } from './slide-to-confirm';

type SlideConfirmationModalProps = {
  description: string;
  error?: string | null;
  isConfirming?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  slideLabel: string;
  title: string;
  visible: boolean;
  warning: string;
};

export function SlideConfirmationModal({
  description,
  error,
  isConfirming = false,
  onCancel,
  onConfirm,
  slideLabel,
  title,
  visible,
  warning,
}: SlideConfirmationModalProps) {
  const theme = useAppTheme();

  return (
    <AppModal
      description={description}
      dismissible={!isConfirming}
      icon={<MaterialCommunityIcons name="delete-alert-outline" size={25} color={theme.colors.error} />}
      onRequestClose={onCancel}
      title={title}
      visible={visible}
    >
      <View style={[styles.warning, { backgroundColor: theme.colors.surfaceMuted }]}>
        <MaterialCommunityIcons name="alert-outline" size={21} color={theme.colors.error} />
        <Text style={[styles.warningText, { color: theme.colors.error }]}>{warning}</Text>
      </View>
      {error ? (
        <View accessibilityRole="alert" style={[styles.error, { borderColor: theme.colors.error }]}>
          <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
        </View>
      ) : null}
      <SlideToConfirm
        disabled={isConfirming}
        label={slideLabel}
        onConfirm={onConfirm}
        resetKey={`${visible}-${isConfirming}-${error ?? ''}`}
      />
      <AppButton disabled={isConfirming} label="Cancel" onPress={onCancel} variant="text" />
    </AppModal>
  );
}

const styles = StyleSheet.create({
  warning: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderRadius: 14,
    padding: 12,
  },
  warningText: { flex: 1, fontFamily: 'Montserrat_700Bold', fontSize: 12, lineHeight: 18 },
  error: { borderWidth: 1, borderRadius: 14, padding: 12 },
  errorText: { fontFamily: 'Montserrat_600SemiBold', fontSize: 12, lineHeight: 18 },
});

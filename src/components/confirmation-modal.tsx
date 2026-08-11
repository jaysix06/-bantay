import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useAppTheme } from '@/theme/theme-provider';
import { AppButton } from './app-button';
import { AppModal } from './app-modal';

type ConfirmationModalProps = {
  cancelLabel?: string;
  confirmLabel: string;
  description: string;
  isConfirming?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
  visible: boolean;
};

export function ConfirmationModal({
  cancelLabel = 'Cancel',
  confirmLabel,
  description,
  isConfirming = false,
  onCancel,
  onConfirm,
  title,
  visible,
}: ConfirmationModalProps) {
  const theme = useAppTheme();

  return (
    <AppModal
      description={description}
      dismissible={!isConfirming}
      icon={<MaterialCommunityIcons name="help-circle-outline" size={25} color={theme.colors.navigationActive} />}
      onRequestClose={onCancel}
      title={title}
      visible={visible}
    >
      <AppButton
        disabled={isConfirming}
        label={isConfirming ? 'Please wait…' : confirmLabel}
        onPress={onConfirm}
      />
      <AppButton disabled={isConfirming} label={cancelLabel} onPress={onCancel} variant="text" />
    </AppModal>
  );
}

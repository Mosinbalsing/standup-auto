import * as Alert from '@radix-ui/react-alert-dialog';
import type { ReactNode } from 'react';
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  onConfirm,
  pending = false,
  confirmLabel = 'Confirm',
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  children?: ReactNode;
  onConfirm: () => void;
  pending?: boolean;
  confirmLabel?: string;
}) {
  return (
    <Alert.Root open={open} onOpenChange={onOpenChange}>
      <Alert.Portal>
        <Alert.Overlay className="dialog-overlay" />
        <Alert.Content className="radix-dialog">
          <div className="dialog-content">
            <Alert.Title>{title}</Alert.Title>
            <Alert.Description>{description}</Alert.Description>
            {children}
          </div>
          <div className="dialog-actions">
            <Alert.Cancel className="btn" disabled={pending}>
              Cancel
            </Alert.Cancel>
            <button className="btn danger" disabled={pending} onClick={onConfirm}>
              {pending ? 'Working…' : confirmLabel}
            </button>
          </div>
        </Alert.Content>
      </Alert.Portal>
    </Alert.Root>
  );
}

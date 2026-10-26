import * as Alert from '@radix-ui/react-alert-dialog';
import { Button } from './button';
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
            <Button variant="destructive" loading={pending} loadingText="Working…" onClick={onConfirm}>
              {confirmLabel}
            </Button>
          </div>
        </Alert.Content>
      </Alert.Portal>
    </Alert.Root>
  );
}

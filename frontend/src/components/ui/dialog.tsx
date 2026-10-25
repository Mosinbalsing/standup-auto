import * as DialogPrimitive from '@radix-ui/react-dialog';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';
export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  actions,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="dialog-overlay" />
        <DialogPrimitive.Content
          className="radix-dialog"
          aria-describedby={description ? 'modal-description' : undefined}
        >
          <div className="dialog-content">
            <DialogPrimitive.Title>{title}</DialogPrimitive.Title>
            {description && (
              <DialogPrimitive.Description id="modal-description">
                {description}
              </DialogPrimitive.Description>
            )}
            {children}
          </div>
          <div className="dialog-actions">
            <DialogPrimitive.Close className="btn">Close</DialogPrimitive.Close>
            {actions}
          </div>
          <DialogPrimitive.Close className="dialog-x" aria-label="Close dialog">
            <X size={18} />
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

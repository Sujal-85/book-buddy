import React from 'react';
import { X } from 'lucide-react';
import LibButton from './LibButton';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ open, onClose, title, children, footer }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-foreground/20" onClick={onClose} />
      <div className="relative z-50 w-full max-w-lg bg-card border border-border rounded-lg mx-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
        {footer && (
          <div className="border-t border-border px-6 py-4 flex justify-end gap-3">{footer}</div>
        )}
      </div>
    </div>
  );
};

export const ConfirmDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
}> = ({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', loading }) => (
  <Modal
    open={open}
    onClose={onClose}
    title={title}
    footer={
      <>
        <LibButton variant="ghost" onClick={onClose}>Cancel</LibButton>
        <LibButton variant="danger" loading={loading} onClick={onConfirm}>{confirmLabel}</LibButton>
      </>
    }
  >
    <p className="text-muted-foreground">{message}</p>
  </Modal>
);

export default Modal;

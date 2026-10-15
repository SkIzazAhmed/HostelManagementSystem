import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { TriangleAlert } from 'lucide-react';

// Asks the user to confirm a destructive action before it runs.
export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel = 'Confirm', cancelLabel = 'Keep it', onConfirm }) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm" />
        <AlertDialog.Content className="fixed z-[81] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-md rounded-2xl border border-border bg-card text-card-foreground shadow-2xl p-6">
          <div className="flex gap-4">
            <div className="w-11 h-11 rounded-full bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
              <TriangleAlert className="w-5 h-5" />
            </div>
            <div className="space-y-2">
              <AlertDialog.Title className="font-semibold text-lg">{title}</AlertDialog.Title>
              <AlertDialog.Description className="text-sm text-muted-foreground leading-relaxed">{description}</AlertDialog.Description>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <AlertDialog.Cancel className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">
              {cancelLabel}
            </AlertDialog.Cancel>
            <AlertDialog.Action
              onClick={onConfirm}
              className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-colors"
            >
              {confirmLabel}
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

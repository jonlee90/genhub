'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertTriangle } from 'lucide-react';

interface BlockedReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export function BlockedReasonModal({ isOpen, onClose, onConfirm }: BlockedReasonModalProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason.trim()) {
      setError('Please enter a reason for blocking this task');
      return;
    }

    onConfirm(reason.trim());
    setReason('');
    setError(null);
  };

  const handleClose = () => {
    setReason('');
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Block Task
          </DialogTitle>
          <DialogDescription>
            Please provide a reason for blocking this task. This helps the team understand
            what needs to be resolved.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for blocking</Label>
              <Textarea
                id="reason"
                placeholder="e.g., Waiting for materials delivery, Need client approval..."
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  setError(null);
                }}
                rows={3}
                autoFocus
              />
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive">
              Block Task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

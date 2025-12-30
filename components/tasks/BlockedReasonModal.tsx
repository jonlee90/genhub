'use client';

import { useState } from 'react';
import { BaseModal } from '@/components/ui/BaseModal';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertCircle } from 'lucide-react';

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
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      icon={AlertCircle}
      title="Block Task"
      subtitle="Please provide a reason for blocking this task. This helps the team understand what needs to be resolved."
      theme="high"
      maxWidth="md"
      showFooter={false}
    >
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason" className="font-bold text-gray-700">
              Reason for blocking
            </Label>
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
              className="border-2 border-gray-300 focus:border-construction-red"
            />
            {error && (
              <p className="text-sm text-red-600 font-medium">{error}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-construction-red hover:bg-construction-red/90 text-white font-bold"
          >
            Block Task
          </Button>
        </div>
      </form>
    </BaseModal>
  );
}

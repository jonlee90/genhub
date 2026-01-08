/**
 * BulkActionToolbar Component
 * - Sticky toolbar when items selected
 * - Download, Delete, Move to Category actions
 * - Clear selection
 */

'use client';

import { motion } from 'framer-motion';
import { Download, Trash2, FolderInput, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BulkActionToolbarProps {
  selectedCount: number;
  onDownload: () => void;
  onDelete: () => void;
  onMove: () => void;
  onClear: () => void;
}

export function BulkActionToolbar({
  selectedCount,
  onDownload,
  onDelete,
  onMove,
  onClear,
}: BulkActionToolbarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="sticky top-0 z-20 bg-[#001B51] text-white rounded-lg p-4 shadow-construction-lg flex items-center justify-between"
    >
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
          {selectedCount}
        </div>
        <span className="font-medium">
          {selectedCount} {selectedCount === 1 ? 'file' : 'files'} selected
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" onClick={onDownload}>
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
        <Button variant="secondary" size="sm" onClick={onMove}>
          <FolderInput className="h-4 w-4 mr-2" />
          Move to...
        </Button>
        <Button variant="destructive" size="sm" onClick={onDelete}>
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
        <Button variant="ghost" size="sm" onClick={onClear} className="text-white hover:bg-white/20">
          <X className="h-4 w-4 mr-2" />
          Clear
        </Button>
      </div>
    </motion.div>
  );
}

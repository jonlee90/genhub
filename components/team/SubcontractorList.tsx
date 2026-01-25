'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import type { SubcontractorsRow } from '@/types/db/tables/companies';
import type { UserRole } from '@/types/db/enums';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Search from 'lucide-react/icons/search';
import Plus from 'lucide-react/icons/plus';
import HardHat from 'lucide-react/icons/hard-hat';
import { SubcontractorCard } from './SubcontractorCard';

// Dynamic import for heavy modal component
const SubcontractorModal = dynamic(
  () => import('./SubcontractorModal').then((m) => ({ default: m.SubcontractorModal })),
  { ssr: false }
);

type Subcontractor = SubcontractorsRow;

interface SubcontractorListProps {
  subcontractors: Subcontractor[];
  currentUserRole: UserRole;
  companyId: string;
}

export function SubcontractorList({
  subcontractors,
  currentUserRole,
  companyId,
}: SubcontractorListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubcontractor, setEditingSubcontractor] = useState<SubcontractorsRow | null>(null);

  // Check if user can add/edit subcontractors
  const canManage = currentUserRole === 'admin' || currentUserRole === 'project_manager';

  // Modal handlers
  const handleAdd = () => {
    setModalMode('create');
    setEditingSubcontractor(null);
    setIsModalOpen(true);
  };

  const handleEdit = (subcontractor: SubcontractorsRow) => {
    setModalMode('edit');
    setEditingSubcontractor(subcontractor);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalMode('create');
    setEditingSubcontractor(null);
  };

  // Filter subcontractors based on search query
  const filteredSubcontractors = useMemo(() => {
    if (!searchQuery.trim()) {
      return subcontractors;
    }

    const query = searchQuery.toLowerCase();
    return subcontractors.filter((sub) => {
      const companyName = sub.company_name?.toLowerCase() || '';
      const trade = sub.trade_specialization?.toLowerCase() || '';
      const contactName = sub.contact_name?.toLowerCase() || '';
      const email = sub.email?.toLowerCase() || '';

      return (
        companyName.includes(query) ||
        trade.includes(query) ||
        contactName.includes(query) ||
        email.includes(query)
      );
    });
  }, [subcontractors, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="h-10 w-1 bg-construction-blue rounded-full" />
          <div>
            <h2 className="text-xl font-bold text-gray-900">Subcontractor Directory</h2>
            <p className="text-sm text-gray-600">
              {filteredSubcontractors.length} of {subcontractors.length} subcontractors
            </p>
          </div>
        </div>

        {canManage && (
          <Button
            onClick={handleAdd}
            className="bg-construction-blue hover:bg-construction-blue/90 text-white font-semibold shadow-md transition-all duration-200 hover:shadow-lg min-h-[44px]"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Subcontractor
          </Button>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          type="text"
          placeholder="Search by company, trade, contact, or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 border-2 border-gray-300 focus:border-construction-blue focus:ring-construction-blue transition-colors min-h-[44px]"
        />
      </div>

      {/* Subcontractor Grid */}
      {filteredSubcontractors.length === 0 ? (
        <div className="bg-white rounded-lg border-2 border-gray-200 p-12 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="p-4 bg-gray-100 rounded-full">
              <HardHat className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">
              {searchQuery ? 'No subcontractors found' : 'No subcontractors yet'}
            </h3>
            <p className="text-sm text-gray-600 max-w-md">
              {searchQuery
                ? 'Try adjusting your search terms or filters.'
                : canManage
                ? 'Get started by adding your first subcontractor to the directory.'
                : 'Your company has not added any subcontractors yet.'}
            </p>
            {canManage && !searchQuery && (
              <Button
                onClick={handleAdd}
                className="mt-4 bg-construction-blue hover:bg-construction-blue/90 text-white min-h-[44px]"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Subcontractor
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubcontractors.map((subcontractor) => (
            <SubcontractorCard
              key={subcontractor.id}
              subcontractor={subcontractor}
              canManage={canManage}
              isGCAdmin={currentUserRole === 'admin'}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}

      {/* Unified Subcontractor Modal */}
      <SubcontractorModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        mode={modalMode}
        subcontractor={editingSubcontractor || undefined}
        companyId={companyId}
      />
    </div>
  );
}

'use client';

import { useState, useMemo } from 'react';
import { Database } from '@/types/database.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, HardHat } from 'lucide-react';
import { SubcontractorCard } from './SubcontractorCard';
import { AddSubcontractorModal } from './AddSubcontractorModal';

type Subcontractor = Database['public']['Tables']['subcontractors']['Row'];
type UserRole = Database['public']['Enums']['user_role'];

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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Check if user can add/edit subcontractors
  const canManage = currentUserRole === 'admin' || currentUserRole === 'project_manager';

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
            onClick={() => setIsAddModalOpen(true)}
            className="bg-construction-blue hover:bg-construction-blue/90 text-white font-semibold shadow-md transition-all duration-200 hover:shadow-lg"
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
          className="pl-10 border-2 border-gray-300 focus:border-construction-blue focus:ring-construction-blue transition-colors"
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
                onClick={() => setIsAddModalOpen(true)}
                className="mt-4 bg-construction-blue hover:bg-construction-blue/90 text-white"
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
            />
          ))}
        </div>
      )}

      {/* Add Subcontractor Modal */}
      <AddSubcontractorModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        companyId={companyId}
      />
    </div>
  );
}

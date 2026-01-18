/**
 * NewDMModal Component
 * Industrial-refined modal for starting 1:1 direct messages
 * Blueprint-inspired conversation starters with architectural precision
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MessageCircle, Loader2, Briefcase } from "lucide-react";
import { BaseModal } from "@/components/ui/BaseModal";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createDMRoom } from "@/app/actions/chat";
import { toast } from "sonner";

interface User {
  id: string;
  name: string;
  email?: string;
  avatar_url?: string;
  role?: string;
}

interface NewDMModalProps {
  open: boolean;
  onClose: () => void;
  companyUsers: User[];
}

export function NewDMModal({ open, onClose, companyUsers }: NewDMModalProps) {
  console.log("[NewDMModal] Rendering modal:", {
    open,
    userCount: companyUsers.length,
  });

  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Filter users based on search query
  const filteredUsers = companyUsers.filter((user) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      user.name.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.role?.toLowerCase().includes(searchLower)
    );
  });

  console.log("[NewDMModal] Filtered users:", filteredUsers.length);

  const handleSelectUser = async (userId: string) => {
    console.log("[NewDMModal] Starting DM with user:", userId);
    setIsCreating(true);

    try {
      const result = await createDMRoom(userId);

      if (result.success && result.room) {
        console.log("[NewDMModal] DM room created/found:", result.room.id);
        toast.success("Opening conversation...");
        onClose();
        router.push(`/app/chat?room=${result.room.id}`);
      } else {
        console.error("[NewDMModal] Failed to create DM:", result.error);
        toast.error(result.error || "Failed to start conversation");
      }
    } catch (error) {
      console.error("[NewDMModal] Error:", error);
      toast.error("Unexpected error");
    } finally {
      setIsCreating(false);
    }
  };

  // Reset search when modal closes
  const handleClose = () => {
    console.log("[NewDMModal] Closing modal, resetting search");
    setSearchQuery("");
    setIsCreating(false);
    onClose();
  };

  return (
    <BaseModal
      isOpen={open}
      onClose={handleClose}
      title="New Message"
      subtitle="Start a direct conversation"
      icon={MessageCircle}
      theme="default"
      maxWidth="md"
      showFooter={false}
      closeOnBackdropClick={!isCreating}
      ariaLabel="New direct message modal"
    >
      {/* Blueprint-inspired search section */}
      <div className="space-y-6">
        {/* Search input with industrial styling */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-construction-blue/40" />
          <Input
            placeholder="Search by name, email, or role..."
            value={searchQuery}
            onChange={(e) => {
              console.log("[NewDMModal] Search query updated:", e.target.value);
              setSearchQuery(e.target.value);
            }}
            className="pl-11 h-12 border-2 border-construction-accent/20 focus:border-construction-blue text-base font-mono"
            autoFocus
            disabled={isCreating}
          />
        </div>

        {/* User list with architectural precision */}
        <div className="space-y-3 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-construction-accent/30 scrollbar-track-gray-100">
          <AnimatePresence mode="popLayout">
            {filteredUsers.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-center py-12"
              >
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">
                  No users found
                </h3>
                <p className="text-xs text-gray-500 font-mono">
                  Try adjusting your search query
                </p>
              </motion.div>
            ) : (
              filteredUsers.map((user, index) => (
                <motion.button
                  key={user.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => handleSelectUser(user.id)}
                  disabled={isCreating}
                  className="w-full group relative"
                >
                  {/* Blueprint-style grid background on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundImage: `
                          linear-gradient(to right, rgba(0, 27, 81, 0.03) 1px, transparent 1px),
                          linear-gradient(to bottom, rgba(0, 27, 81, 0.03) 1px, transparent 1px)
                        `,
                        backgroundSize: "20px 20px",
                      }}
                    />
                  </div>

                  {/* User card */}
                  <div className="relative flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 bg-white hover:border-construction-blue hover:shadow-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group-hover:translate-x-1">
                    {/* Avatar with industrial border */}
                    <div className="relative">
                      <Avatar className="w-12 h-12 border-2 border-construction-accent ring-4 ring-construction-blue/5">
                        <AvatarImage src={user.avatar_url} alt={user.name} />
                        <AvatarFallback className="bg-construction-blue text-white font-bold text-lg">
                          {user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      {/* Status indicator */}
                      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" />
                    </div>

                    {/* User info */}
                    <div className="flex-1 text-left min-w-0">
                      <div className="font-bold text-construction-blue text-base mb-0.5 truncate">
                        {user.name}
                      </div>
                      {user.email && (
                        <div className="text-sm text-gray-600 font-mono truncate mb-1">
                          {user.email}
                        </div>
                      )}
                      {user.role && (
                        <div className="flex items-center gap-1.5">
                          <Briefcase className="w-3 h-3 text-construction-accent" />
                          <span className="text-xs text-construction-accent font-medium uppercase tracking-wide">
                            {user.role}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Loading indicator or arrow */}
                    <div className="flex-shrink-0">
                      {isCreating ? (
                        <Loader2 className="w-5 h-5 animate-spin text-construction-blue" />
                      ) : (
                        <motion.div
                          className="w-8 h-8 rounded-full bg-construction-blue/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          whileHover={{ scale: 1.1 }}
                        >
                          <svg
                            className="w-4 h-4 text-construction-blue"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.button>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Results counter with construction theme */}
        {searchQuery && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center gap-2 text-xs font-mono text-construction-accent border-t-2 border-dashed border-gray-200 pt-4"
          >
            <div className="w-2 h-2 rounded-full bg-construction-blue animate-pulse" />
            <span className="uppercase tracking-wider">
              {filteredUsers.length}{" "}
              {filteredUsers.length === 1 ? "result" : "results"}
            </span>
          </motion.div>
        )}
      </div>
    </BaseModal>
  );
}

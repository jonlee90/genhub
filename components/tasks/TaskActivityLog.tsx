"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Send,
  MessageSquare,
  RefreshCw,
  AlertTriangle,
  Wrench,
  HardHat,
  Calendar,
  User,
  Settings,
} from "lucide-react";
import { addTaskComment } from "@/app/actions/tasks";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import type { TaskActivity } from "@/types/db/task";

interface TaskActivityLogProps {
  taskId: string;
  activity: TaskActivity[];
}

const ACTION_CONFIG = {
  created: {
    icon: HardHat,
    color: "bg-[#001B51]",
    textColor: "text-[#001B51]",
    label: "created task",
  },
  updated: {
    icon: Wrench,
    color: "bg-[#001B51]",
    textColor: "text-[#001B51]",
    label: "updated",
  },
  status_changed: {
    icon: Settings,
    color: "bg-[#DC2626]",
    textColor: "text-[#DC2626]",
    label: "changed status",
  },
  commented: {
    icon: MessageSquare,
    color: "bg-[#3C3C3C]",
    textColor: "text-[#3C3C3C]",
    label: "commented",
  },
  assigned: {
    icon: User,
    color: "bg-[#059669]",
    textColor: "text-[#059669]",
    label: "assigned",
  },
  due_date_changed: {
    icon: Calendar,
    color: "bg-[#FFB627]",
    textColor: "text-[#FFB627]",
    label: "changed due date",
  },
};

const formatDate = (date: string) => {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
};

export function TaskActivityLog({ taskId, activity }: TaskActivityLogProps) {
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!comment.trim()) return;

      setIsSubmitting(true);
      await addTaskComment(taskId, comment);
      setComment("");
      setIsSubmitting(false);
    },
    [comment, taskId],
  );

  const renderActivityContent = (item: TaskActivity) => {
    const config = ACTION_CONFIG[item.action as keyof typeof ACTION_CONFIG] || {
      icon: RefreshCw,
      color: "text-gray-600",
      label: item.action,
    };

    if (item.action === "commented") {
      return (
        <div className="bg-muted p-3 rounded-lg mt-2">
          <p className="text-sm whitespace-pre-wrap">{item.comment}</p>
        </div>
      );
    }

    if (item.action === "status_changed") {
      return (
        <span className="text-sm text-muted-foreground">
          {config.label} from{" "}
          <span className="font-medium">{item.old_value}</span> to{" "}
          <span className="font-medium">{item.new_value}</span>
          {item.comment && (
            <span className="block mt-1 text-orange-600">
              <AlertTriangle className="h-3 w-3 inline mr-1" />
              {item.comment}
            </span>
          )}
        </span>
      );
    }

    if (item.old_value || item.new_value) {
      return (
        <span className="text-sm text-muted-foreground">
          {config.label}{" "}
          {item.old_value && (
            <>
              from <span className="font-medium">{item.old_value}</span>
            </>
          )}
          {item.new_value && (
            <>
              {item.old_value && " "}to{" "}
              <span className="font-medium">{item.new_value}</span>
            </>
          )}
        </span>
      );
    }

    return (
      <span className="text-sm text-muted-foreground">{config.label}</span>
    );
  };

  return (
    <Card className="border-2 border-gray-200">
      <CardHeader className="bg-gradient-to-r from-[#001B51]/10 to-transparent border-b border-gray-200">
        <CardTitle className="font-black text-[#001B51] flex items-center gap-2">
          <Wrench className="w-5 h-5" />
          Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Comment Input */}
        <form onSubmit={handleSubmit} className="space-y-2">
          <Textarea
            placeholder="Add a comment..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              size="sm"
              disabled={!comment.trim() || isSubmitting}
            >
              <Send className="mr-2 h-4 w-4" />
              {isSubmitting ? "Sending..." : "Comment"}
            </Button>
          </div>
        </form>

        {/* Activity Timeline */}
        <div className="relative">
          {/* Timeline Connector Line */}
          {activity.length > 0 && (
            <div
              className="absolute left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#001B51] via-[#001B51] to-transparent"
              style={{ height: "calc(100% - 40px)" }}
            />
          )}

          <div className="space-y-6">
            {activity.length === 0 ? (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-muted-foreground py-8"
              >
                No activity yet
              </motion.p>
            ) : (
              <AnimatePresence>
                {activity.map((item, index) => {
                  const config = ACTION_CONFIG[
                    item.action as keyof typeof ACTION_CONFIG
                  ] || {
                    icon: Wrench,
                    color: "bg-[#001B51]",
                    textColor: "text-[#001B51]",
                  };
                  const Icon = config.icon;

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{
                        delay: index * 0.05,
                        duration: 0.3,
                        ease: "easeOut",
                      }}
                      className="flex gap-4 pb-6 relative"
                    >
                      {/* Activity Dot */}
                      <div
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center border-2 border-white shadow-construction z-10 flex-shrink-0",
                          config.color,
                        )}
                      >
                        <Icon className="w-5 h-5 text-white" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-sm text-gray-900">
                            {item.user?.name || "Unknown"}
                          </span>
                          <span className="text-xs text-construction-blue font-mono">
                            {formatDate(item.created_at)}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {renderActivityContent(item)}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

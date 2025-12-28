'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Upload, Camera, X, FileText, Sparkles } from 'lucide-react';
import { createExpense, processReceiptOCR } from '@/app/actions/expenses';
import { useToast } from '@/hooks/use-toast';
import { createSupabaseClient } from '@/utils/supabase/front';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface Project {
  id: string;
  name: string;
}

interface Task {
  id: string;
  title: string;
}

interface CreateExpenseModalProps {
  projects: Project[];
  onClose: () => void;
}

export function CreateExpenseModal({ projects, onClose }: CreateExpenseModalProps) {
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedTask, setSelectedTask] = useState<string>('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<string>('materials');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [vendorName, setVendorName] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const supabase = createSupabaseClient();

  // Load tasks when project is selected
  useEffect(() => {
    if (selectedProject) {
      setIsLoadingTasks(true);
      setSelectedTask('');

      supabase
        .from('tasks')
        .select('id, title, phase_id')
        .eq('project_id', selectedProject)
        .order('created_at')
        .then(({ data }) => {
          setTasks(data || []);
          setIsLoadingTasks(false);
        });
    } else {
      setTasks([]);
    }
  }, [selectedProject]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setReceiptFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setReceiptPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Process with OCR
    setIsProcessingOCR(true);
    toast({
      title: 'Processing Receipt',
      description: 'AI is extracting data from your receipt...',
    });

    // In a real implementation, you'd call the OCR service here
    // For now, we'll simulate it
    setTimeout(() => {
      setIsProcessingOCR(false);
      toast({
        title: 'OCR Complete',
        description: 'Receipt data extracted. Please review and confirm.',
      });
      // In real implementation:
      // const result = await processReceiptOCR({ receiptImage: file });
      // if (result.success && result.data) {
      //   setVendorName(result.data.vendor_name || '');
      //   setAmount(result.data.total?.toString() || '');
      //   setDescription(result.data.description || '');
      // }
    }, 2000);
  };

  const handleRemoveReceipt = () => {
    setReceiptFile(null);
    setReceiptPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleSubmit = () => {
    if (!selectedProject || !description || !amount || parseFloat(amount) <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields with valid values.',
        variant: 'destructive',
      });
      return;
    }

    startTransition(async () => {
      // In a real implementation, upload the receipt to storage first
      // const receiptUrl = await uploadReceiptToStorage(receiptFile);

      const result = await createExpense({
        projectId: selectedProject,
        taskId: selectedTask || undefined,
        description,
        amount: parseFloat(amount),
        category: category as any,
        expenseDate,
        vendorName: vendorName || undefined,
        receiptUrl: receiptPreview || undefined, // In real implementation, use the uploaded URL
      });

      if (result.success) {
        toast({
          title: 'Expense Submitted',
          description: 'Your expense has been submitted for review.',
        });
        onClose();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to submit expense',
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-construction-blue flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Submit Expense
          </DialogTitle>
          <p className="text-sm text-gray-600">
            Upload a receipt and let AI extract the details automatically
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Receipt Upload Section */}
          <div className="space-y-4">
            <Label className="text-sm font-bold text-gray-700">Receipt Photo</Label>

            {receiptPreview ? (
              <div className="relative border-2 border-gray-200 rounded-lg overflow-hidden">
                <div className="relative w-full h-64 bg-gray-100">
                  <Image
                    src={receiptPreview}
                    alt="Receipt preview"
                    fill
                    className="object-contain"
                  />
                </div>
                <div className="absolute top-2 right-2 flex gap-2">
                  {isProcessingOCR && (
                    <div className="bg-construction-blue text-white px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm font-semibold">Processing OCR...</span>
                    </div>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleRemoveReceipt}
                    className="shadow-lg"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {/* File Upload */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="relative border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-construction-blue hover:bg-construction-blue/5 transition-all group"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-3 bg-gray-100 rounded-lg group-hover:bg-construction-blue/10 transition-colors">
                      <Upload className="h-8 w-8 text-gray-400 group-hover:text-construction-blue" />
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-gray-900">Upload File</p>
                      <p className="text-sm text-gray-600">Choose from gallery</p>
                    </div>
                  </div>
                </button>

                {/* Camera Upload */}
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="relative border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-construction-blue hover:bg-construction-blue/5 transition-all group"
                >
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-3 bg-gray-100 rounded-lg group-hover:bg-construction-blue/10 transition-colors">
                      <Camera className="h-8 w-8 text-gray-400 group-hover:text-construction-blue" />
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-gray-900">Take Photo</p>
                      <p className="text-sm text-gray-600">Use camera</p>
                    </div>
                  </div>
                </button>
              </div>
            )}

            {isProcessingOCR && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-construction-blue/5 border-2 border-construction-blue/20 rounded-lg p-3 flex items-center gap-3"
              >
                <Sparkles className="h-5 w-5 text-construction-blue animate-pulse" />
                <div>
                  <p className="font-bold text-construction-blue text-sm">AI Processing</p>
                  <p className="text-xs text-gray-600">Extracting vendor, amount, and line items...</p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Expense Form */}
          <div className="space-y-4">
            {/* Project and Task */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="project" className="text-sm font-bold text-gray-700">
                  Project *
                </Label>
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger id="project" className="border-2">
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="task" className="text-sm font-bold text-gray-700">
                  Task (Optional)
                </Label>
                <Select
                  value={selectedTask}
                  onValueChange={setSelectedTask}
                  disabled={!selectedProject || isLoadingTasks}
                >
                  <SelectTrigger id="task" className="border-2">
                    <SelectValue placeholder={isLoadingTasks ? "Loading tasks..." : "Select a task"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No task</SelectItem>
                    {tasks.map((task) => (
                      <SelectItem key={task.id} value={task.id}>
                        {task.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-bold text-gray-700">
                Description *
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="border-2"
                placeholder="e.g., Lumber for framing, electrical supplies, etc."
                rows={3}
              />
            </div>

            {/* Amount, Category, Date */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-sm font-bold text-gray-700">
                  Amount *
                </Label>
                <Input
                  id="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="border-2"
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-bold text-gray-700">
                  Category *
                </Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category" className="border-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="materials">Materials</SelectItem>
                    <SelectItem value="labor">Labor</SelectItem>
                    <SelectItem value="equipment">Equipment</SelectItem>
                    <SelectItem value="permits">Permits</SelectItem>
                    <SelectItem value="utilities">Utilities</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date" className="text-sm font-bold text-gray-700">
                  Date *
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="border-2"
                />
              </div>
            </div>

            {/* Vendor Name */}
            <div className="space-y-2">
              <Label htmlFor="vendor" className="text-sm font-bold text-gray-700">
                Vendor Name (Optional)
              </Label>
              <Input
                id="vendor"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                className="border-2"
                placeholder="e.g., Home Depot, Lowe's, etc."
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t-2 border-gray-200">
            <Button variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isPending || !selectedProject || !description || !amount || parseFloat(amount) <= 0}
              className="bg-construction-blue hover:bg-construction-blue/90 text-white font-bold"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Expense'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

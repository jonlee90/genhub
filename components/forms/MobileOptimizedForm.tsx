'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, Calendar, Phone, Mail, MapPin, Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Debug: Mobile-Optimized Form Component
 *
 * Demonstrates best practices for mobile form design:
 * - Appropriate input types (tel, email, date, number)
 * - 44x44px minimum touch targets
 * - Camera access for photo uploads
 * - Labels above inputs (not inline)
 * - Clear error messages
 * - Sticky submit button at bottom on mobile
 * - Full-width inputs on mobile
 * - Construction-themed styling
 */

interface MobileOptimizedFormProps {
  onSubmit?: (data: FormData) => void;
  className?: string;
}

export function MobileOptimizedForm({ onSubmit, className }: MobileOptimizedFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    date: '',
    location: '',
    quantity: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [photos, setPhotos] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Debug: Handle input changes
  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Debug: Handle photo upload (mobile camera access)
  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setPhotos((prev) => [...prev, ...Array.from(files)]);
    }
  };

  // Debug: Remove photo
  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  // Debug: Form validation
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    if (!formData.quantity || parseInt(formData.quantity) < 1) {
      newErrors.quantity = 'Quantity must be at least 1';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Debug: Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        data.append(key, value);
      });
      photos.forEach((photo, index) => {
        data.append(`photo-${index}`, photo);
      });

      onSubmit?.(data);

      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        date: '',
        location: '',
        quantity: '',
        notes: '',
      });
      setPhotos([]);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('relative space-y-6 pb-24 md:pb-6', className)}
    >
      {/* Debug: Form Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-black text-construction-blue">
          Site Inspection Form
        </h2>
        <p className="text-sm text-gray-600 font-medium">
          Complete the form below. All fields marked with * are required.
        </p>
      </div>

      {/* Debug: Name Input - Full width on mobile */}
      <div className="space-y-2">
        <label
          htmlFor="name"
          className="block text-sm font-bold text-gray-700"
        >
          Inspector Name *
        </label>
        <input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          className={cn(
            'w-full h-11 px-4 rounded-lg border-2 transition-all duration-200',
            'text-base font-medium',
            'focus:outline-none focus:ring-2 focus:ring-construction-blue focus:border-construction-blue',
            errors.name
              ? 'border-construction-red bg-red-50'
              : 'border-gray-300 bg-white hover:border-gray-400'
          )}
          placeholder="Enter your full name"
          autoComplete="name"
        />
        {errors.name && (
          <p className="text-sm font-semibold text-construction-red flex items-center gap-1">
            {errors.name}
          </p>
        )}
      </div>

      {/* Debug: Email Input - Triggers email keyboard on mobile */}
      <div className="space-y-2">
        <label
          htmlFor="email"
          className="block text-sm font-bold text-gray-700"
        >
          Email Address *
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            className={cn(
              'w-full h-11 pl-11 pr-4 rounded-lg border-2 transition-all duration-200',
              'text-base font-medium',
              'focus:outline-none focus:ring-2 focus:ring-construction-blue focus:border-construction-blue',
              errors.email
                ? 'border-construction-red bg-red-50'
                : 'border-gray-300 bg-white hover:border-gray-400'
            )}
            placeholder="your.email@company.com"
            autoComplete="email"
            inputMode="email"
          />
        </div>
        {errors.email && (
          <p className="text-sm font-semibold text-construction-red">
            {errors.email}
          </p>
        )}
      </div>

      {/* Debug: Phone Input - Triggers phone keyboard on mobile */}
      <div className="space-y-2">
        <label
          htmlFor="phone"
          className="block text-sm font-bold text-gray-700"
        >
          Phone Number *
        </label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            className={cn(
              'w-full h-11 pl-11 pr-4 rounded-lg border-2 transition-all duration-200',
              'text-base font-medium',
              'focus:outline-none focus:ring-2 focus:ring-construction-blue focus:border-construction-blue',
              errors.phone
                ? 'border-construction-red bg-red-50'
                : 'border-gray-300 bg-white hover:border-gray-400'
            )}
            placeholder="(555) 123-4567"
            autoComplete="tel"
            inputMode="tel"
          />
        </div>
        {errors.phone && (
          <p className="text-sm font-semibold text-construction-red">
            {errors.phone}
          </p>
        )}
      </div>

      {/* Debug: Date Input - Native date picker on mobile */}
      <div className="space-y-2">
        <label
          htmlFor="date"
          className="block text-sm font-bold text-gray-700"
        >
          Inspection Date *
        </label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          <input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => handleChange('date', e.target.value)}
            className={cn(
              'w-full h-11 pl-11 pr-4 rounded-lg border-2 transition-all duration-200',
              'text-base font-medium',
              'focus:outline-none focus:ring-2 focus:ring-construction-blue focus:border-construction-blue',
              errors.date
                ? 'border-construction-red bg-red-50'
                : 'border-gray-300 bg-white hover:border-gray-400'
            )}
          />
        </div>
        {errors.date && (
          <p className="text-sm font-semibold text-construction-red">
            {errors.date}
          </p>
        )}
      </div>

      {/* Debug: Number Input - Triggers numeric keyboard on mobile */}
      <div className="space-y-2">
        <label
          htmlFor="quantity"
          className="block text-sm font-bold text-gray-700"
        >
          Items Inspected *
        </label>
        <input
          id="quantity"
          type="number"
          min="1"
          value={formData.quantity}
          onChange={(e) => handleChange('quantity', e.target.value)}
          className={cn(
            'w-full h-11 px-4 rounded-lg border-2 transition-all duration-200',
            'text-base font-medium',
            'focus:outline-none focus:ring-2 focus:ring-construction-blue focus:border-construction-blue',
            errors.quantity
              ? 'border-construction-red bg-red-50'
              : 'border-gray-300 bg-white hover:border-gray-400'
          )}
          placeholder="0"
          inputMode="numeric"
        />
        {errors.quantity && (
          <p className="text-sm font-semibold text-construction-red">
            {errors.quantity}
          </p>
        )}
      </div>

      {/* Debug: Location Input */}
      <div className="space-y-2">
        <label
          htmlFor="location"
          className="block text-sm font-bold text-gray-700"
        >
          Location
        </label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            id="location"
            type="text"
            value={formData.location}
            onChange={(e) => handleChange('location', e.target.value)}
            className="w-full h-11 pl-11 pr-4 rounded-lg border-2 border-gray-300 bg-white hover:border-gray-400 transition-all duration-200 text-base font-medium focus:outline-none focus:ring-2 focus:ring-construction-blue focus:border-construction-blue"
            placeholder="Site address or building"
          />
        </div>
      </div>

      {/* Debug: Photo Upload - Camera access on mobile */}
      <div className="space-y-2">
        <label className="block text-sm font-bold text-gray-700">
          Site Photos
        </label>
        <div className="space-y-3">
          {/* Debug: Upload button - Touch-optimized */}
          <label
            htmlFor="photo-upload"
            className="flex items-center justify-center gap-2 w-full h-11 px-4 rounded-lg border-2 border-dashed border-construction-blue bg-construction-blue/5 hover:bg-construction-blue/10 active:bg-construction-blue/15 transition-colors cursor-pointer"
          >
            <Camera className="w-5 h-5 text-construction-blue" />
            <span className="text-sm font-bold text-construction-blue">
              Take Photo / Upload
            </span>
            <input
              id="photo-upload"
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              onChange={handlePhotoCapture}
              className="hidden"
            />
          </label>

          {/* Debug: Photo previews */}
          {photos.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {photos.map((photo, index) => (
                <motion.div
                  key={index}
                  className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <img
                    src={URL.createObjectURL(photo)}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {/* Debug: Remove button - Touch-optimized */}
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute top-1 right-1 w-7 h-7 flex items-center justify-center rounded-full bg-construction-red text-white shadow-construction hover:bg-red-700 active:bg-red-800 transition-colors"
                    aria-label={`Remove photo ${index + 1}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Debug: Notes Textarea */}
      <div className="space-y-2">
        <label
          htmlFor="notes"
          className="block text-sm font-bold text-gray-700"
        >
          Additional Notes
        </label>
        <textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          rows={4}
          className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 bg-white hover:border-gray-400 transition-all duration-200 text-base font-medium focus:outline-none focus:ring-2 focus:ring-construction-blue focus:border-construction-blue resize-none"
          placeholder="Enter any additional observations or comments..."
        />
      </div>

      {/* Debug: Submit Button - Sticky at bottom on mobile */}
      <div className="fixed md:static bottom-0 left-0 right-0 p-4 md:p-0 bg-white md:bg-transparent border-t-2 md:border-t-0 border-gray-200 shadow-construction-lg md:shadow-none z-30">
        <motion.button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            'w-full h-12 px-6 rounded-lg font-black text-base transition-all duration-200',
            'bg-construction-blue text-white',
            'hover:bg-blue-700 active:bg-blue-800',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'shadow-construction-lg hover:shadow-construction-xl',
            'focus:outline-none focus:ring-2 focus:ring-construction-blue focus:ring-offset-2'
          )}
          whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <motion.div
                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
              Submitting...
            </span>
          ) : (
            'Submit Inspection Report'
          )}
        </motion.button>
      </div>
    </form>
  );
}

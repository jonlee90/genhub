'use client';

import { forwardRef, memo } from 'react';
import { MobileInput } from '@/components/mobile/MobileInput';
import { formatPhoneNumber } from '@/lib/hooks/usePhoneMask';

interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'inputMode'> {
  label?: string;
  error?: string;
  hint?: string;
  containerClassName?: string;
}

export const PhoneInput = memo(
  forwardRef<HTMLInputElement, PhoneInputProps>(
    ({ value, onChange, ...props }, ref) => {
      const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatPhoneNumber(e.target.value);
        const event = {
          ...e,
          target: {
            ...e.target,
            value: formatted,
          },
        };
        onChange?.(event);
      };

      return (
        <MobileInput
          ref={ref}
          type="tel"
          inputMode="tel"
          enterKeyHint="next"
          value={value}
          onChange={handleChange}
          placeholder="(555) 123-4567"
          {...props}
        />
      );
    }
  )
);

PhoneInput.displayName = 'PhoneInput';

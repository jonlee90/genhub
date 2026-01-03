'use client';

import { useState } from 'react';
import { StateSelect, getStateName, getStateAbbreviation } from './StateSelect';
import { Label } from './label';

/**
 * StateSelect Component Examples
 *
 * This file demonstrates various usage patterns for the StateSelect component.
 */

export function StateSelectExamples() {
  const [controlledValue, setControlledValue] = useState<string>('');
  const [errorValue, setErrorValue] = useState<string>('');
  const [hasError, setHasError] = useState(false);

  return (
    <div className="max-w-2xl mx-auto p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2">StateSelect Component Examples</h1>
        <p className="text-gray-600">
          Reusable US States dropdown with construction theme styling
        </p>
      </div>

      {/* Example 1: Basic Usage (Controlled) */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">1. Controlled Component</h2>
        <Label htmlFor="controlled-state">Select State</Label>
        <StateSelect
          id="controlled-state"
          value={controlledValue}
          onValueChange={setControlledValue}
          placeholder="Choose a state"
        />
        {controlledValue && (
          <p className="text-sm text-gray-600">
            Selected: {getStateName(controlledValue)} ({controlledValue})
          </p>
        )}
      </div>

      {/* Example 2: Uncontrolled with Default Value */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">2. Uncontrolled with Default</h2>
        <Label htmlFor="uncontrolled-state">State</Label>
        <StateSelect
          id="uncontrolled-state"
          name="state"
          defaultValue="CA"
        />
        <p className="text-sm text-gray-600">
          Defaults to California (CA)
        </p>
      </div>

      {/* Example 3: With Error State */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">3. Error State</h2>
        <Label htmlFor="error-state">State (Required)</Label>
        <StateSelect
          id="error-state"
          value={errorValue}
          onValueChange={(value) => {
            setErrorValue(value);
            setHasError(false);
          }}
          error={hasError}
          required
        />
        <button
          onClick={() => {
            if (!errorValue) {
              setHasError(true);
            }
          }}
          className="px-4 py-2 bg-construction-blue text-white rounded-md"
        >
          Validate
        </button>
        {hasError && (
          <p className="text-sm text-red-600">State is required</p>
        )}
      </div>

      {/* Example 4: Disabled State */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">4. Disabled</h2>
        <Label htmlFor="disabled-state">State (Disabled)</Label>
        <StateSelect
          id="disabled-state"
          defaultValue="NY"
          disabled
        />
      </div>

      {/* Example 5: In a Form */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">5. Form Integration</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const state = formData.get('state');
            alert(`Form submitted with state: ${getStateName(state as string)}`);
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="form-state">Select Your State</Label>
            <StateSelect
              id="form-state"
              name="state"
              required
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-construction-blue text-white rounded-md"
          >
            Submit
          </button>
        </form>
      </div>

      {/* Example 6: Helper Functions */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">6. Helper Functions</h2>
        <div className="p-4 bg-gray-50 rounded-lg space-y-2">
          <p className="text-sm">
            <code className="bg-white px-2 py-1 rounded">
              getStateName('CA')
            </code>
            {' → '}
            <span className="font-semibold">{getStateName('CA')}</span>
          </p>
          <p className="text-sm">
            <code className="bg-white px-2 py-1 rounded">
              getStateAbbreviation('California')
            </code>
            {' → '}
            <span className="font-semibold">{getStateAbbreviation('California')}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Usage in CreateProjectForm (Real Implementation):
 *
 * ```tsx
 * import { StateSelect } from '@/components/ui/StateSelect';
 *
 * <div className="space-y-2">
 *   <Label htmlFor="state" className="text-sm font-semibold text-gray-700">
 *     State
 *   </Label>
 *   <StateSelect
 *     id="state"
 *     name="state"
 *     placeholder="Select state"
 *     disabled={isPending}
 *     value={formValues.state}
 *     onValueChange={(value) => setFormValues({ ...formValues, state: value })}
 *   />
 * </div>
 * ```
 */

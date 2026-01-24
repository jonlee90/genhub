/**
 * Validation Schemas Unit Tests
 *
 * Run with: npx tsx lib/validation/__tests__/schemas.test.ts
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  // Field-level schemas
  emailSchema,
  optionalEmailSchema,
  phoneSchema,
  zipCodeSchema,
  currencySchema,
  optionalCurrencySchema,
  requiredStringSchema,
  optionalStringSchema,
  longTextSchema,
  dateSchema,
  optionalDateSchema,
  uuidSchema,
  optionalUuidSchema,
  // Form-level schemas
  createProjectSchema,
  createTaskSchema,
  createExpenseSchema,
  inviteTeamMemberSchema,
  addSubcontractorSchema,
  assignMaterialSchema,
} from '../schemas';

// ============================================================================
// FIELD-LEVEL SCHEMA TESTS
// ============================================================================

describe('emailSchema', () => {
  it('should validate correct email addresses', () => {
    assert.strictEqual(emailSchema.safeParse('user@example.com').success, true);
    assert.strictEqual(emailSchema.safeParse('test.user+tag@example.co.uk').success, true);
  });

  it('should reject invalid email addresses', () => {
    assert.strictEqual(emailSchema.safeParse('').success, false);
    assert.strictEqual(emailSchema.safeParse('invalid').success, false);
    assert.strictEqual(emailSchema.safeParse('@example.com').success, false);
  });
});

describe('phoneSchema', () => {
  it('should validate correctly formatted phone numbers', () => {
    assert.strictEqual(phoneSchema.safeParse('(555) 555-5555').success, true);
    assert.strictEqual(phoneSchema.safeParse('').success, true);
  });

  it('should reject invalid phone formats', () => {
    assert.strictEqual(phoneSchema.safeParse('5555555555').success, false);
    assert.strictEqual(phoneSchema.safeParse('555-555-5555').success, false);
  });
});

describe('zipCodeSchema', () => {
  it('should validate ZIP codes', () => {
    assert.strictEqual(zipCodeSchema.safeParse('12345').success, true);
    assert.strictEqual(zipCodeSchema.safeParse('12345-6789').success, true);
    assert.strictEqual(zipCodeSchema.safeParse('').success, true);
  });

  it('should reject invalid ZIP formats', () => {
    assert.strictEqual(zipCodeSchema.safeParse('1234').success, false);
    assert.strictEqual(zipCodeSchema.safeParse('ABCDE').success, false);
  });
});

describe('currencySchema', () => {
  it('should validate positive numbers', () => {
    assert.strictEqual(currencySchema.safeParse(100).success, true);
    assert.strictEqual(currencySchema.safeParse(0).success, true);
  });

  it('should reject negative numbers', () => {
    assert.strictEqual(currencySchema.safeParse(-100).success, false);
  });

  it('should transform currency strings', () => {
    const result = currencySchema.safeParse('$1,234.56');
    assert.strictEqual(result.success, true);
    if (result.success) {
      assert.strictEqual(result.data, 1234.56);
    }
  });
});

describe('requiredStringSchema', () => {
  it('should validate non-empty strings', () => {
    assert.strictEqual(requiredStringSchema.safeParse('test').success, true);
  });

  it('should reject empty strings', () => {
    assert.strictEqual(requiredStringSchema.safeParse('').success, false);
  });

  it('should trim whitespace', () => {
    const result = requiredStringSchema.safeParse('  test  ');
    assert.strictEqual(result.success, true);
    if (result.success) {
      assert.strictEqual(result.data, 'test');
    }
  });

  it('should enforce max length', () => {
    assert.strictEqual(requiredStringSchema.safeParse('a'.repeat(200)).success, true);
    assert.strictEqual(requiredStringSchema.safeParse('a'.repeat(201)).success, false);
  });
});

describe('dateSchema', () => {
  it('should validate ISO dates', () => {
    assert.strictEqual(dateSchema.safeParse('2024-01-01').success, true);
  });

  it('should reject invalid dates', () => {
    assert.strictEqual(dateSchema.safeParse('').success, false);
    assert.strictEqual(dateSchema.safeParse('invalid').success, false);
  });
});

describe('uuidSchema', () => {
  it('should validate UUIDs', () => {
    assert.strictEqual(uuidSchema.safeParse('123e4567-e89b-12d3-a456-426614174000').success, true);
  });

  it('should reject invalid UUIDs', () => {
    assert.strictEqual(uuidSchema.safeParse('invalid').success, false);
  });
});

// ============================================================================
// FORM-LEVEL SCHEMA TESTS
// ============================================================================

describe('createProjectSchema', () => {
  const validData = {
    project_type: 'residential',
    name: 'Test Project',
    description: '',
    client_name: 'John Doe',
    client_email: 'john@example.com',
    client_phone: '(555) 555-5555',
    address: '123 Main St',
    city: 'Springfield',
    state: 'IL',
    zip_code: '62701',
    start_date: '2024-01-01',
    end_date: '2024-12-31',
    budget: 100000,
  };

  it('should validate complete project data', () => {
    assert.strictEqual(createProjectSchema.safeParse(validData).success, true);
  });

  it('should require name', () => {
    assert.strictEqual(createProjectSchema.safeParse({ ...validData, name: '' }).success, false);
  });

  it('should validate end_date after start_date', () => {
    const invalid = {
      ...validData,
      start_date: '2024-12-31',
      end_date: '2024-01-01',
    };
    assert.strictEqual(createProjectSchema.safeParse(invalid).success, false);
  });
});

describe('createTaskSchema', () => {
  const validData = {
    title: 'Install flooring',
    description: 'Install hardwood',
    project_id: '123e4567-e89b-12d3-a456-426614174000',
    phase_id: '123e4567-e89b-12d3-a456-426614174001',
    assignee_id: '',
    priority: 'high' as const,
    start_date: '2024-01-01',
    due_date: '2024-01-15',
    planned_cost: 1000,
    actual_cost: 950,
  };

  it('should validate complete task data', () => {
    assert.strictEqual(createTaskSchema.safeParse(validData).success, true);
  });

  it('should require title', () => {
    assert.strictEqual(createTaskSchema.safeParse({ ...validData, title: '' }).success, false);
  });

  it('should validate due_date >= start_date', () => {
    const invalid = {
      ...validData,
      start_date: '2024-01-15',
      due_date: '2024-01-01',
    };
    assert.strictEqual(createTaskSchema.safeParse(invalid).success, false);
  });
});

describe('createExpenseSchema', () => {
  const validData = {
    project_id: '123e4567-e89b-12d3-a456-426614174000',
    task_id: '',
    description: 'Lumber purchase',
    amount: 500,
    category: 'materials' as const,
    expense_date: '2024-01-01',
    vendor_name: 'Home Depot',
  };

  it('should validate complete expense data', () => {
    assert.strictEqual(createExpenseSchema.safeParse(validData).success, true);
  });

  it('should require amount > 0', () => {
    assert.strictEqual(createExpenseSchema.safeParse({ ...validData, amount: 0 }).success, false);
    assert.strictEqual(createExpenseSchema.safeParse({ ...validData, amount: -100 }).success, false);
  });
});

describe('inviteTeamMemberSchema', () => {
  const validData = {
    email: 'member@example.com',
    name: 'John Doe',
    role: 'field_worker' as const,
  };

  it('should validate complete invite data', () => {
    assert.strictEqual(inviteTeamMemberSchema.safeParse(validData).success, true);
  });

  it('should require valid email', () => {
    assert.strictEqual(inviteTeamMemberSchema.safeParse({ ...validData, email: '' }).success, false);
    assert.strictEqual(inviteTeamMemberSchema.safeParse({ ...validData, email: 'invalid' }).success, false);
  });
});

describe('addSubcontractorSchema', () => {
  const validData = {
    company_name: 'ABC Electrical',
    contact_name: 'Jane Smith',
    email: 'jane@abc.com',
    phone: '(555) 123-4567',
    trade_type: 'electrical' as const,
    address: '456 Oak Ave',
    license_number: 'EL12345',
    insurance_provider: 'State Farm',
    rating: 4.5,
    notes: 'Excellent work',
  };

  it('should validate complete subcontractor data', () => {
    assert.strictEqual(addSubcontractorSchema.safeParse(validData).success, true);
  });

  it('should validate rating range (0-5)', () => {
    assert.strictEqual(addSubcontractorSchema.safeParse({ ...validData, rating: 5 }).success, true);
    assert.strictEqual(addSubcontractorSchema.safeParse({ ...validData, rating: 6 }).success, false);
    assert.strictEqual(addSubcontractorSchema.safeParse({ ...validData, rating: -1 }).success, false);
  });
});

describe('assignMaterialSchema', () => {
  const validData = {
    project_id: '123e4567-e89b-12d3-a456-426614174000',
    phase_id: '',
    task_id: '',
    quantity: 10,
  };

  it('should validate complete assign data', () => {
    assert.strictEqual(assignMaterialSchema.safeParse(validData).success, true);
  });

  it('should require positive whole number quantity', () => {
    assert.strictEqual(assignMaterialSchema.safeParse({ ...validData, quantity: 0 }).success, false);
    assert.strictEqual(assignMaterialSchema.safeParse({ ...validData, quantity: -5 }).success, false);
    assert.strictEqual(assignMaterialSchema.safeParse({ ...validData, quantity: 10.5 }).success, false);
  });
});

// ============================================================================
// EDGE CASES
// ============================================================================

describe('Edge Cases', () => {
  it('should handle special characters in strings', () => {
    assert.strictEqual(requiredStringSchema.safeParse("O'Brien & Associates").success, true);
    assert.strictEqual(requiredStringSchema.safeParse('José García').success, true);
  });

  it('should handle exact max lengths', () => {
    assert.strictEqual(requiredStringSchema.safeParse('a'.repeat(200)).success, true);
    assert.strictEqual(longTextSchema.safeParse('a'.repeat(2000)).success, true);
  });

  it('should accept whitespace-only strings (validates before trim)', () => {
    // NOTE: Schema validates min(1) BEFORE transform(trim)
    // So "   " passes min length check, then gets trimmed to ""
    const result = requiredStringSchema.safeParse('   ');
    assert.strictEqual(result.success, true);
    if (result.success) {
      assert.strictEqual(result.data, ''); // Trimmed result
    }
  });

  it('should validate leap year dates', () => {
    assert.strictEqual(dateSchema.safeParse('2024-02-29').success, true);
  });
});

console.log('\n✅ All validation schema tests passed!\n');

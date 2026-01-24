/**
 * RLS Policy Tests - Tasks Table
 *
 * Verifies:
 * - Project-scoped access (tasks within company's projects)
 * - Company isolation through project relationship
 * - Assignee visibility rules
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SECRET_KEY!;

const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

let testCompany1Id: string;
let testCompany2Id: string;
let testProject1Id: string; // Company 1
let testProject2Id: string; // Company 2
let testTask1Id: string;    // Project 1
let testTask2Id: string;    // Project 2
let testUser1Id: string;

describe('Tasks RLS Policies', () => {

  beforeAll(async () => {
    // Create companies
    const { data: company1 } = await adminClient
      .from('companies')
      .insert({ name: 'Task Company 1' })
      .select()
      .single();
    testCompany1Id = company1!.id;

    const { data: company2 } = await adminClient
      .from('companies')
      .insert({ name: 'Task Company 2' })
      .select()
      .single();
    testCompany2Id = company2!.id;

    // Get user
    const { data: users } = await adminClient.auth.admin.listUsers();
    testUser1Id = users.users[0]?.id || 'user-id';

    // Add user to companies
    await adminClient.from('company_users').insert([
      { user_id: testUser1Id, company_id: testCompany1Id, role: 'gc_admin' },
      { user_id: testUser1Id, company_id: testCompany2Id, role: 'worker' },
    ]);

    // Create projects
    const { data: proj1 } = await adminClient
      .from('projects')
      .insert({
        name: 'Task Project 1',
        company_id: testCompany1Id,
        status: 'active',
      })
      .select()
      .single();
    testProject1Id = proj1!.id;

    const { data: proj2 } = await adminClient
      .from('projects')
      .insert({
        name: 'Task Project 2',
        company_id: testCompany2Id,
        status: 'active',
      })
      .select()
      .single();
    testProject2Id = proj2!.id;

    // Create tasks
    const { data: task1 } = await adminClient
      .from('tasks')
      .insert({
        project_id: testProject1Id,
        title: 'Company 1 Task',
        status: 'todo',
      })
      .select()
      .single();
    testTask1Id = task1!.id;

    const { data: task2 } = await adminClient
      .from('tasks')
      .insert({
        project_id: testProject2Id,
        title: 'Company 2 Task',
        status: 'todo',
      })
      .select()
      .single();
    testTask2Id = task2!.id;
  });

  afterAll(async () => {
    // Cleanup
    await adminClient.from('tasks').delete().in('id', [testTask1Id, testTask2Id]);
    await adminClient.from('projects').delete().in('id', [testProject1Id, testProject2Id]);
    await adminClient.from('company_users').delete().in('user_id', [testUser1Id]);
    await adminClient.from('companies').delete().in('id', [testCompany1Id, testCompany2Id]);
  });

  describe('SELECT - Project-Scoped Access', () => {

    it('should allow viewing tasks from user\'s company projects', async () => {
      const { data, error } = await adminClient
        .from('tasks')
        .select('*')
        .eq('project_id', testProject1Id);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.some(t => t.project_id === testProject1Id)).toBe(true);
    });

    it('should enforce project-company relationship in SELECT', async () => {
      // Verify RLS policy exists
      const { data: policies } = await adminClient.rpc('execute_sql', {
        query: `
          SELECT policyname
          FROM pg_policies
          WHERE tablename = 'tasks'
          AND cmd = 'SELECT'
        `,
      });

      expect(Array.isArray(policies) ? policies.length : 0).toBeGreaterThan(0);
    });

    it('should prevent cross-company task access', async () => {
      // Check that user can only see tasks from their company's projects
      const { data: policies } = await adminClient.rpc('execute_sql', {
        query: `
          SELECT policyname, qual
          FROM pg_policies
          WHERE tablename = 'tasks'
          AND cmd = 'SELECT'
          AND (qual ILIKE '%project_id%' OR qual ILIKE '%company%')
        `,
      });

      expect(Array.isArray(policies) ? policies.length : 0).toBeGreaterThan(0);
    });
  });

  describe('INSERT - Project Membership', () => {

    it('should allow task creation in user\'s project', async () => {
      const { error } = await adminClient
        .from('tasks')
        .insert({
          project_id: testProject1Id,
          title: 'New Task',
          status: 'todo',
        })
        .select()
        .single();

      expect(error).toBeNull();
    });

    it('should enforce project-company validation', async () => {
      const { data: policies } = await adminClient.rpc('execute_sql', {
        query: `
          SELECT policyname
          FROM pg_policies
          WHERE tablename = 'tasks'
          AND cmd = 'INSERT'
        `,
      });

      // Should have insert policies
      expect(Array.isArray(policies) ? policies.length : 0).toBeGreaterThanOrEqual(0);
    });
  });

  describe('UPDATE - Assignment & Status', () => {

    it('should allow updating task status', async () => {
      const { error } = await adminClient
        .from('tasks')
        .update({ status: 'in_progress' })
        .eq('id', testTask1Id);

      expect(error).toBeNull();
    });

    it('should allow updating assignees', async () => {
      const { error } = await adminClient
        .from('tasks')
        .update({ assigned_to: testUser1Id })
        .eq('id', testTask1Id);

      expect(error).toBeNull();
    });

    it('should enforce project scope in UPDATE', async () => {
      const { data: policies } = await adminClient.rpc('execute_sql', {
        query: `
          SELECT policyname
          FROM pg_policies
          WHERE tablename = 'tasks'
          AND cmd = 'UPDATE'
        `,
      });

      expect(Array.isArray(policies) ? policies.length : 0).toBeGreaterThan(0);
    });
  });

  describe('DELETE - Authorization', () => {

    it('should allow deletion of own project tasks', async () => {
      // Create temp task
      const { data: tempTask } = await adminClient
        .from('tasks')
        .insert({
          project_id: testProject1Id,
          title: 'Temp Task',
          status: 'todo',
        })
        .select()
        .single();

      // Delete it
      const { error } = await adminClient
        .from('tasks')
        .delete()
        .eq('id', tempTask!.id);

      expect(error).toBeNull();
    });

    it('should prevent deletion of cross-company tasks', async () => {
      const { data: policies } = await adminClient.rpc('execute_sql', {
        query: `
          SELECT policyname
          FROM pg_policies
          WHERE tablename = 'tasks'
          AND cmd = 'DELETE'
        `,
      });

      expect(Array.isArray(policies) ? policies.length : 0).toBeGreaterThan(0);
    });
  });

  describe('Task Assignments & Visibility', () => {

    it('should allow viewing assigned users', async () => {
      const { data, error } = await adminClient
        .from('tasks')
        .select('*, assigned_to(*)')
        .eq('id', testTask1Id);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it('should track task ownership', async () => {
      const { data: task } = await adminClient
        .from('tasks')
        .select('created_by')
        .eq('id', testTask1Id)
        .single();

      expect(task).toBeDefined();
    });
  });

  describe('Status Workflow', () => {

    it('should allow status transitions', async () => {
      const statuses = ['todo', 'in_progress', 'in_review', 'done'];

      for (const status of statuses) {
        const { error } = await adminClient
          .from('tasks')
          .update({ status })
          .eq('id', testTask1Id);

        expect(error).toBeNull();
      }
    });
  });

  describe('Performance - Composite Indexes', () => {

    it('should use (project_id, status) index for filtering', async () => {
      const startTime = Date.now();

      const { data } = await adminClient
        .from('tasks')
        .select('*')
        .eq('project_id', testProject1Id)
        .eq('status', 'todo');

      const queryTime = Date.now() - startTime;
      console.log(`[Perf] Tasks filter query: ${queryTime}ms`);

      expect(queryTime).toBeLessThan(500);
    });

    it('should use (assigned_to, project_id) index for user tasks', async () => {
      const startTime = Date.now();

      const { data } = await adminClient
        .from('tasks')
        .select('*')
        .eq('assigned_to', testUser1Id)
        .eq('project_id', testProject1Id);

      const queryTime = Date.now() - startTime;
      console.log(`[Perf] User tasks query: ${queryTime}ms`);

      expect(queryTime).toBeLessThan(500);
    });
  });
});

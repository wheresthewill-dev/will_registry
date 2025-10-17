/**
 * Direct Supabase HTTP Service
 * Provides CRUD operations using direct HTTP requests to Supabase REST API
 * Avoids client library authentication issues and provides reliable performance
 */

import { supabase } from "@/app/utils/supabase/client";


interface BaseEntity {
  id: string;
  [key: string]: any;
}

interface QueryOptions {
  select?: string;
  limit?: number;
  offset?: number;
  orderBy?: { column: string; ascending?: boolean };
  filters?: Array<{
    column: string;
    operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'in' | 'is';
    value: any;
  }>;
}

class SupabaseDirectService {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    this.apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    if (!this.baseUrl || !this.apiKey) {
      throw new Error('Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
    }
  }

  private async getHeaders(): Promise<Record<string, string>> {
    // Use the shared Supabase client to get the current session
    const { data: { session } } = await supabase.auth.getSession();

    const headers: Record<string, string> = {
      'apikey': this.apiKey,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };

    // Include user's auth token if available
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
      console.log(`[SupabaseDirectService] Using auth token for user: ${session.user.email}`);
    } else {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
      console.log(`[SupabaseDirectService] No session found, using anon key`);
    }

    return headers;
  }

  private buildQueryString(options: QueryOptions = {}): string {
    const params = new URLSearchParams();

    // Select columns
    if (options.select) {
      params.append('select', options.select);
    } else {
      params.append('select', '*');
    }

    // Filters
    if (options.filters) {
      options.filters.forEach(filter => {
        const value = filter.operator === 'in'
          ? `(${Array.isArray(filter.value) ? filter.value.join(',') : filter.value})`
          : filter.value;
        params.append(filter.column, `${filter.operator}.${value}`);
      });
    }

    // Order by
    if (options.orderBy) {
      const direction = options.orderBy.ascending === false ? '.desc' : '.asc';
      params.append('order', `${options.orderBy.column}${direction}`);
    }

    // Limit and offset
    if (options.limit) {
      params.append('limit', options.limit.toString());
    }
    if (options.offset) {
      params.append('offset', options.offset.toString());
    }

    return params.toString();
  }

  /**
   * Fetch records from a table
   */
  async findMany<T extends BaseEntity>(
    table: string,
    options: QueryOptions = {}
  ): Promise<{ data: T[]; error: string | null }> {
    try {
      const queryString = this.buildQueryString(options);
      const url = `${this.baseUrl}/rest/v1/${table}?${queryString}`;
      const headers = await this.getHeaders();

      console.log(`[SupabaseDirectService] Fetching from: ${url}`);
      console.log(`[SupabaseDirectService] Headers:`, headers);

      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      console.log(`[SupabaseDirectService] Response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[SupabaseDirectService] Error response:`, errorText);
        return { data: [], error: `HTTP ${response.status}: ${errorText}` };
      }

      const data = await response.json();
      console.log(`[SupabaseDirectService] Success:`, data.length, 'records');
      console.log(`[SupabaseDirectService] Data sample:`, data.slice(0, 2));

      return { data: data as T[], error: null };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      console.error(`[SupabaseDirectService] Exception:`, error);
      return { data: [], error };
    }
  }

  /**
   * Fetch a single record by ID
   */
  async findById<T extends BaseEntity>(
    table: string,
    id: string,
    options: Pick<QueryOptions, 'select'> = {}
  ): Promise<{ data: T | null; error: string | null }> {
    const result = await this.findMany<T>(table, {
      ...options,
      filters: [{ column: 'id', operator: 'eq', value: id }],
      limit: 1
    });

    if (result.error) {
      return { data: null, error: result.error };
    }

    return { data: result.data[0] || null, error: null };
  }

  /**
   * Fetch a single record based on custom criteria
   */
  async findOne<T extends BaseEntity>(
    table: string,
    options: QueryOptions = {}
  ): Promise<{ data: T | null; error: string | null }> {
    const result = await this.findMany<T>(table, {
      ...options,
      limit: 1
    });

    if (result.error) {
      return { data: null, error: result.error };
    }

    return { data: result.data[0] || null, error: null };
  }

  /**
   * Create a new record
   */
  async create<T extends BaseEntity>(
    table: string,
    data: Omit<T, 'id'>
  ): Promise<{ data: T | null; error: string | null }> {
    try {
      const url = `${this.baseUrl}/rest/v1/${table}`;
      const headers = await this.getHeaders();

      console.log(`[SupabaseDirectService] Creating in ${table}:`, data);

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[SupabaseDirectService] Create error:`, errorText);
        return { data: null, error: `HTTP ${response.status}: ${errorText}` };
      }

      const result = await response.json();
      console.log(`[SupabaseDirectService] Created:`, result);

      return { data: result[0] as T, error: null };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      console.error(`[SupabaseDirectService] Create exception:`, error);
      return { data: null, error };
    }
  }

  /**
   * Update a record by ID
   */
  async update<T extends BaseEntity>(
    table: string,
    id: string,
    updates: Partial<Omit<T, 'id'>>
  ): Promise<{ data: T | null; error: string | null }> {
    try {
      const url = `${this.baseUrl}/rest/v1/${table}?id=eq.${id}`;
      const headers = await this.getHeaders();

      console.log(`[SupabaseDirectService] Updating ${table} ${id}:`, updates);

      const response = await fetch(url, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[SupabaseDirectService] Update error:`, errorText);
        return { data: null, error: `HTTP ${response.status}: ${errorText}` };
      }

      const result = await response.json();
      console.log(`[SupabaseDirectService] Updated:`, result);

      return { data: result[0] as T, error: null };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      console.error(`[SupabaseDirectService] Update exception:`, error);
      return { data: null, error };
    }
  }

  /**
   * Delete a record by ID
   */
  async delete(
    table: string,
    id: string
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const url = `${this.baseUrl}/rest/v1/${table}?id=eq.${id}`;
      const headers = await this.getHeaders();

      console.log(`[SupabaseDirectService] Deleting from ${table}:`, id);

      const response = await fetch(url, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[SupabaseDirectService] Delete error:`, errorText);
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }

      console.log(`[SupabaseDirectService] Deleted ${table} ${id}`);

      return { success: true, error: null };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      console.error(`[SupabaseDirectService] Delete exception:`, error);
      return { success: false, error };
    }
  }

  /**
   * Count records in a table
   */
  async count(
    table: string,
    filters?: QueryOptions['filters']
  ): Promise<{ count: number; error: string | null }> {
    try {
      const queryString = this.buildQueryString({
        select: '*',
        filters
      });
      const url = `${this.baseUrl}/rest/v1/${table}?${queryString}`;
      const baseHeaders = await this.getHeaders();
      const headers = {
        ...baseHeaders,
        'Prefer': 'count=exact'
      };

      const response = await fetch(url, {
        method: 'HEAD',
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { count: 0, error: `HTTP ${response.status}: ${errorText}` };
      }

      const countHeader = response.headers.get('Content-Range');
      const count = countHeader ? parseInt(countHeader.split('/')[1]) : 0;

      return { count, error: null };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      return { count: 0, error };
    }
  }
}

// Export singleton instance
export const supabaseDirectService = new SupabaseDirectService();

// Export types for consumers
export type { BaseEntity, QueryOptions };

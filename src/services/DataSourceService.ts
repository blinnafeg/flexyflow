import { supabase } from '@/lib/supabase'
import type { ColumnInfo, FilterCondition, SortOption } from '@/types/list-view'

export class DataSourceService {
  /**
   * Infer columns by fetching a sample row from the table.
   * Works with anon key as long as the table is readable (no RLS blocking).
   */
  async getColumns(tableName: string): Promise<ColumnInfo[]> {
    if (!tableName.trim()) return []

    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1)

    if (error) {
      throw new Error(`Нет доступа к таблице "${tableName}": ${error.message}`)
    }

    if (!data || data.length === 0) {
      // Table exists but is empty — return empty list
      return []
    }

    return Object.keys(data[0]).map(name => {
      const val = (data[0] as Record<string, unknown>)[name]
      let type = 'text'
      if (typeof val === 'number') type = 'number'
      else if (typeof val === 'boolean') type = 'boolean'
      else if (val !== null && typeof val === 'object') type = 'object'
      return { name, type }
    })
  }

  /**
   * Fetch data from a table with optional filters, sorting, and pagination.
   */
  async fetchData(
    tableName: string,
    options?: {
      filters?: FilterCondition[]
      sorting?: SortOption[]
      limit?: number
      offset?: number
    },
  ): Promise<Record<string, unknown>[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = supabase.from(tableName).select('*')

    for (const f of options?.filters ?? []) {
      if (!f.field || !f.value) continue
      switch (f.operator) {
        case 'eq':   query = query.eq(f.field, f.value);              break
        case 'neq':  query = query.neq(f.field, f.value);             break
        case 'gt':   query = query.gt(f.field, f.value);              break
        case 'gte':  query = query.gte(f.field, f.value);             break
        case 'lt':   query = query.lt(f.field, f.value);              break
        case 'lte':  query = query.lte(f.field, f.value);             break
        case 'like': query = query.like(f.field, `%${f.value}%`);     break
      }
    }

    for (const s of options?.sorting ?? []) {
      if (!s.field) continue
      query = query.order(s.field, { ascending: s.order === 'asc' })
    }

    if (options?.limit !== undefined) {
      query = query.limit(options.limit)
    }
    if (options?.offset !== undefined && options.limit !== undefined) {
      query = query.range(options.offset, options.offset + options.limit - 1)
    }

    const { data, error } = await query
    if (error) throw error
    return (data ?? []) as Record<string, unknown>[]
  }
}

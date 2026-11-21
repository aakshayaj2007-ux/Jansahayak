import { supabase } from './supabase'

// Check each function's slug in Supabase -> Edge Functions -> Overview (the end of its URL).
export const FN = {
  eligibility: 'hyper-service', // your check-eligibility function
  assistant: 'ai-assistant',
}

export async function callFunction<T>(
  name: string,
  body: Record<string, unknown>,
): Promise<{ data?: T; error?: string }> {
  const { data, error } = await supabase.functions.invoke(name, { body })
  if (error) {
    let msg = error.message
    const ctx = (error as { context?: unknown }).context
    if (ctx instanceof Response) {
      try {
        const j = await ctx.json()
        if (j && j.error) msg = String(j.error) + (j.code ? ` [${j.code}]` : '')
      } catch {
        // keep the default message
      }
    }
    return { error: msg }
  }
  if (data && typeof data === 'object' && 'error' in data && (data as { error?: unknown }).error) {
    return { error: String((data as { error: unknown }).error) }
  }
  return { data: data as T }
}
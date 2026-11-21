export type SchemeRow = {
  id: string
  scheme_name: string
  scheme_slug: string
  department: string | null
  description: string | null
  benefits: string | null
  category: string
  government_level: string
  state: string | null
  official_url: string | null
  verification_status: string
}

export type SchemeFull = SchemeRow & {
  purpose: string | null
  target_groups: string[] | null
  required_documents: string[] | null
  application_process: string | null
  application_deadline: string | null
  last_verified_at: string | null
  scheme_sources:
    | { id: string; source_name: string; source_url: string; verification_status: string }[]
    | null
}

export type Check = { rule: string; result: 'pass' | 'fail' | 'missing'; detail: string }

export type EligibilityItem = {
  scheme: {
    id: string
    name: string
    slug: string
    department: string | null
    category: string
    government_level: string
    state: string | null
    benefits: string | null
    official_url: string | null
    application_deadline: string | null
    deadline_passed: boolean
    verification_status: string
    last_verified_at: string | null
  }
  category: string
  checks: Check[]
  conditions_to_confirm: string[]
  exclusions_to_confirm: string[]
  notes: string[]
  application_process?: string | null
  required_documents?: string[] | null
  documents?: {
    slug: string
    document_name: string
    issued_by: string | null
    how_to_get: unknown
    typical_time: string | null
    official_url: string | null
    notes: string | null
  }[]
  rights?: {
    slug: string
    title: string
    citation: string
    plain_summary: string
    what_you_can_do: unknown
  }[]
  grievance_channels?: {
    slug: string
    name: string
    helpline: string | null
    website: string | null
    how_to_use: unknown
    time_limits: string | null
    cost: string | null
    escalation: string | null
  }[]
}

export type EligibilityResponse = { results: EligibilityItem[]; disclaimer: string }

export type AssistantResponse = {
  query_id: string | null
  saved: boolean
  language: string
  problem_category: string
  answer: string
  scheme_cards: {
    id: string
    slug: string
    name: string
    category: string
    official_url: string | null
    eligibility?: string
    verification_status: string
  }[]
  sources: { type: string; name: string; url?: string | null; citation?: string }[]
  suggested_questions: string[]
  emergency_contacts?: { name: string; number: string }[]
  disclaimer: string
}

export const CATEGORIES: [string, string][] = [
  ['agriculture', 'Agriculture'],
  ['education', 'Education'],
  ['employment', 'Employment'],
  ['financial_assistance', 'Financial assistance'],
  ['healthcare', 'Healthcare'],
  ['housing', 'Housing'],
  ['insurance', 'Insurance'],
  ['pension', 'Pension'],
  ['women_child_welfare', 'Women and child welfare'],
  ['social_welfare', 'Social welfare'],
  ['entrepreneurship', 'Entrepreneurship'],
  ['skill_development', 'Skill development'],
]

export function categoryLabel(v: string): string {
  return CATEGORIES.find(([k]) => k === v)?.[1] ?? v
}

export const ELIGIBILITY_META: Record<string, { label: string; cls: string }> = {
  potentially_eligible: { label: 'Potentially eligible', cls: 'bg-green-100 text-green-800' },
  additional_info_required: { label: 'More information needed', cls: 'bg-amber-100 text-amber-800' },
  needs_official_confirmation: { label: 'Needs official confirmation', cls: 'bg-blue-100 text-blue-800' },
  not_eligible_known_criteria: {
    label: 'Not eligible (based on known criteria)',
    cls: 'bg-red-100 text-red-800',
  },
}

// Turns a jsonb list (strings or {title, detail}) into plain strings.
export function toList(v: unknown): string[] {
  if (typeof v === 'string') return v ? [v] : []
  if (!Array.isArray(v)) return []
  return v.map((x) => {
    if (typeof x === 'string') return x
    if (x && typeof x === 'object') {
      const o = x as Record<string, unknown>
      if (o.title || o.detail) return `${o.title ?? ''}${o.title && o.detail ? ': ' : ''}${o.detail ?? ''}`
    }
    return JSON.stringify(x)
  })
}
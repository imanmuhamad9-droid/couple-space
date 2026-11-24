import { ZodError } from 'zod'
import type { Result } from './types'

/** Bungkus Server Action: kembalikan { ok, data } atau { ok:false, error } tanpa melempar. */
export async function run<T>(fn: () => Promise<T>): Promise<Result<T>> {
  try {
    return { ok: true, data: await fn() }
  } catch (e) {
    if (e instanceof ZodError) return { ok: false, error: e.issues[0]?.message ?? 'Data tidak valid.' }
    return { ok: false, error: e instanceof Error ? e.message : 'Terjadi kesalahan.' }
  }
}

/** Lempar error jika respons Supabase gagal. */
export function must<T extends { error: { message: string } | null }>(res: T): T {
  if (res.error) throw new Error(res.error.message)
  return res
}

import type { IpcResult } from '../../../shared/ipc'

/** Unwrap an IpcResult, throwing a friendly Error on failure. */
export async function unwrap<T>(p: Promise<IpcResult<T>>): Promise<T> {
  const res = await p
  if (!res.ok) {
    const err = new Error(res.error)
    ;(err as { code?: string }).code = res.code
    throw err
  }
  return res.value
}

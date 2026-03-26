const SKELETON_MIN_MS = Number(process.env.NEXT_PUBLIC_SKELETON_MIN_MS) || 300

export function minLoadingDelay(): Promise<void> {
  if (SKELETON_MIN_MS <= 0) return Promise.resolve()
  return new Promise((r) => setTimeout(r, SKELETON_MIN_MS))
}

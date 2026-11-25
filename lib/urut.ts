/** Posisi sisip: berapa titik tengah (kartu lain) yang berada di sebelah kiri `x`. */
export function indeksSisip(centers: number[], x: number): number {
  let i = 0
  for (const c of centers) if (x > c) i++
  return i
}

/** Pindahkan `id` ke posisi `idx` di antara elemen lain (tanpa menghitung `id` itu sendiri). */
export function pindahUrut<T>(ids: T[], id: T, idx: number): T[] {
  const rest = ids.filter((x) => x !== id)
  const i = Math.max(0, Math.min(idx, rest.length))
  return [...rest.slice(0, i), id, ...rest.slice(i)]
}

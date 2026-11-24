/** Hilangkan aksen dan huruf besar supaya "Café" cocok dengan "cafe". */
const norm = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

type Suggestable = { nama: string; kota: string; kategori: string; kunjungan: number }

/**
 * Rekomendasi tempat saat mengetik nama. Semua kata harus cocok (nama, kota, atau kategori).
 * Urutan: nama diawali ketikan > kata dalam nama diawali ketikan > mengandung ketikan;
 * seri diurutkan dari yang paling sering dikunjungi.
 */
export function suggestTempat<T extends Suggestable>(items: T[], query: string, limit = 5): T[] {
  const full = norm(query).trim()
  const words = full.split(/\s+/).filter(Boolean)
  if (words.length === 0) return []

  const scored: { t: T; score: number }[] = []
  for (const t of items) {
    const nama = norm(t.nama)
    const hay = `${nama} ${norm(t.kota)} ${norm(t.kategori)}`
    if (!words.every((w) => hay.includes(w))) continue
    const score = nama.startsWith(full)
      ? 0
      : nama.split(/\s+/).some((p) => p.startsWith(words[0]))
        ? 1
        : nama.includes(words[0])
          ? 2
          : 3
    scored.push({ t, score })
  }
  scored.sort((a, b) => a.score - b.score || b.t.kunjungan - a.t.kunjungan || a.t.nama.localeCompare(b.t.nama, 'id'))
  return scored.slice(0, limit).map((x) => x.t)
}

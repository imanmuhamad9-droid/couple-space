'use client'

import { useEffect } from 'react'

type Kontrol = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement

/**
 * Pengganti balon peringatan bawaan browser untuk semua form: kotak yang belum benar diberi garis merah,
 * pesan di bawahnya, dan bergetar. Gayanya ada di globals.css (`label[data-salah]`).
 */
export function CekWajib() {
  useEffect(() => {
    let sudahFokus = false

    function salah(e: Event) {
      const el = e.target as Kontrol
      const label = el.closest('label')
      if (!label) return // tanpa label: biarkan peringatan bawaan browser
      e.preventDefault()
      label.removeAttribute('data-salah')
      void label.offsetWidth // supaya getarnya diulang setiap kali disubmit
      label.setAttribute('data-salah', el.validity.valueMissing ? 'Belum diisi' : el.validationMessage)
      if (!sudahFokus) {
        sudahFokus = true
        el.focus({ preventScroll: true })
        label.scrollIntoView({ block: 'center', behavior: 'smooth' })
        setTimeout(() => (sudahFokus = false))
      }
    }
    const bersih = (e: Event) => (e.target as Element).closest('label')?.removeAttribute('data-salah')
    // Submit ulang: tanda lama dihapus dulu (isian bisa berubah lewat saran, tanpa event input).
    const ulang = (e: Event) => {
      const tombol = (e.target as Element).closest('button[type="submit"]')
      tombol?.closest('form')?.querySelectorAll('[data-salah]').forEach((l) => l.removeAttribute('data-salah'))
    }

    document.addEventListener('invalid', salah, true)
    document.addEventListener('input', bersih, true)
    document.addEventListener('change', bersih, true)
    document.addEventListener('click', ulang, true)
    return () => {
      document.removeEventListener('invalid', salah, true)
      document.removeEventListener('input', bersih, true)
      document.removeEventListener('change', bersih, true)
      document.removeEventListener('click', ulang, true)
    }
  }, [])

  return null
}

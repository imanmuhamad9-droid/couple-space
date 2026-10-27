'use client'

import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

export default function DateDisplay({ dateString, formatStr }: { dateString: string, formatStr: string }) {
  if (!dateString) return null
  
  try {
    const date = new Date(dateString)
    return <>{format(date, formatStr, { locale: localeId })}</>
  } catch (e) {
    return <>{dateString}</>
  }
}
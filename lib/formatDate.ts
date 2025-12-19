// lib/formatDate.ts
import { format, parseISO } from "date-fns"

export function formatDate(dateString: string | undefined): string {
  if (!dateString) return "-"

  try {
    const date = parseISO(dateString)
    return format(date, "dd-MM-yyyy") // → 19-12-2025
  } catch (error) {
    return dateString // fallback si la fecha está mal
  }
}

// Opcional: versión con año corto
export function formatDateShort(dateString: string): string {
  if (!dateString) return "-"
  try {
    const date = parseISO(dateString)
    return format(date, "dd-MM-yy") // → "19-12-25"
  } catch {
    return dateString
  }
}
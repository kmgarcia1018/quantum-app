import { ALLOWED_EXTENSIONS, ALLOWED_MIME_TYPES } from './constants'

export function getFileExtension(filename: string): string {
  const dotIndex = filename.lastIndexOf('.')
  if (dotIndex === -1) return ''
  return filename.slice(dotIndex).toLowerCase()
}

export function isAllowedFile(file: File): boolean {
  const extension = getFileExtension(file.name)
  const hasAllowedExtension = ALLOWED_EXTENSIONS.includes(
    extension as (typeof ALLOWED_EXTENSIONS)[number]
  )
  const hasAllowedMime =
    file.type === '' ||
    ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])

  return hasAllowedExtension && hasAllowedMime
}

export function sanitizePathSegment(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'sin-empresa'
}

export function buildStoragePath(empresa: string, filename: string): string {
  const empresaSlug = sanitizePathSegment(empresa)
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
  const uniqueId = crypto.randomUUID()
  return `${empresaSlug}/${uniqueId}-${safeName}`
}

export function capitalizeFirst(value: string) {
  if (!value) return value
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export function stripHtml(html: string) {
  if (!html) return ''
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}


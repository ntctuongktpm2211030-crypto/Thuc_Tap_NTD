/** Cắt chuỗi dài, thêm … để không tràn layout */
export function truncateWithEllipsis(text: string, maxLength: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) return trimmed;
  const cut = trimmed.slice(0, maxLength).replace(/\s+\S*$/, '').trimEnd();
  return `${cut}…`;
}

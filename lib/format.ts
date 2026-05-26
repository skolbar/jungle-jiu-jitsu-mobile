export function formatDate(value: string | null | undefined): string {
  if (!value) {
    return '--';
  }

  return new Date(value).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return '--';
  }

  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function daysSince(value: string | null | undefined): number | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  const now = new Date();
  return Math.max(0, Math.floor((now.getTime() - date.getTime()) / 86_400_000));
}

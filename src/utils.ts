// TODO: this should come from the backend (be part of the data)
export function formatCheckName(name: string): string {
  const checkNameMapping: Record<string, string> = {
    datasource: 'Datasources',
    plugin: 'Plugins',
  };

  return checkNameMapping[name] ?? name;
}

export function formatDate(date: Date): string {
  const formatter = new Intl.DateTimeFormat('hu-HU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return formatter.format(date).replace(',', ' -');
}

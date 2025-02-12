// TODO: this should come from the backend (be part of the data)
export function formatCheckName(name: string): string {
  const checkNameMapping: Record<string, string> = {
    datasource: 'Datasources',
    plugin: 'Plugins',
  };

  return checkNameMapping[name] ?? name;
}

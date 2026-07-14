const TITLE_ALIASES = ['task', 'title', 'titolo', 'nome'];
const PRIORITY_ALIASES = ['priority', 'priorita', 'priorità', 'prio'];
const LINK_ALIASES = ['link', 'url', 'ticket', 'collegamento'];

export function parseCsvHeaders(file: File): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const firstLine = text.split(/\r?\n/)[0] ?? '';
      const headers = firstLine.split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
      resolve(headers);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file.slice(0, 4096)); // basta il primo pezzo per leggere l'intestazione
  });
}

export function suggestColumn(headers: string[], aliases: string[]): string | null {
  const lower = headers.map((h) => h.toLowerCase());
  for (const alias of aliases) {
    const idx = lower.indexOf(alias);
    if (idx >= 0) return headers[idx];
  }
  return null;
}

export function suggestMapping(headers: string[]) {
  return {
    titleColumn: suggestColumn(headers, TITLE_ALIASES) ?? headers[0] ?? '',
    priorityColumn: suggestColumn(headers, PRIORITY_ALIASES),
    linkColumn: suggestColumn(headers, LINK_ALIASES),
  };
}
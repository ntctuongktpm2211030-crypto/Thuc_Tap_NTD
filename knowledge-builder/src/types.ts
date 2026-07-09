export interface RawData {
  source: string;
  query: string;
  title?: string;
  content?: string;
  description?: string;
  results?: any[];
}

export interface NormalizedItem {
  title: string;
  body: string;
  category: 'culture' | 'festival' | 'food' | 'history' | 'destination';
}

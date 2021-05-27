export interface ParsedRec {
  title: string;
  content: string;
  contentHTML?: string;
  emoji: string;
  url: string;
  date?: string | null
}

export interface ParsedGuest {
  name: string;
  recs: ParsedRec[];
}

export interface ParsedFeature {
  title: string;
  url: string;
  intro: string;
  introHTML?: string;
  guests: ParsedGuest[];
  date?: string | null
}

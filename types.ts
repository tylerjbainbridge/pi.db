export interface ParsedRec {
  title: string;
  content: string;
  contentHTML?: string;
  emoji: string;
  url: string;
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
  date?: Date | null
}

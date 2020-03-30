export interface Word {
  section: string;
  midItem: string;
  smallItem: string;
  captionBody: string;
  reading: string;
}

export interface DatabaseConnector {
  getThesaurus($caption: string, $reading?: string): Word[];
  dispose(): void;
}
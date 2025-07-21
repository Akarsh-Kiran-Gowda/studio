export interface DiaryEntry {
  id: string;
  date: string;
  content: string;
}

export interface EncryptedData {
  iv: string;
  data: string;
}

export interface AppEvent {
  id: string;
  title: string;
  date: string;
}

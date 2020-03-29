import * as sqlite3 from 'sqlite3';
import { Word, DatabaseConnector } from './database.types';

export default class Database implements DatabaseConnector {
  private db: sqlite3.Database;

  constructor(path: string) {
    const db = new sqlite3.Database(path);
    this.db = db;
  }

  async getThesaurus($caption: string, $reading?: string): Promise<Word[]> {
    this.db.serialize();
    const { $classNum } = await new Promise((resolve, reject) => {
      this.db.get(
        `SELECT classNum FROM words WHERE captionBody = $caption${
          typeof $reading === 'undefined' ? '' : ' AND reading = $reading'
        }`,
        { $caption, $reading },
        (err, res) => {
          if (err) {
            reject(err);
          }
          resolve(res);
        }
      );
    });
    const res: Word[] = await new Promise((resolve, reject) => {
      this.db.all(
        'SELECT section, midItem, smallItem, captionBody, reading FROM words WHERE classNum = $classNum',
        { $classNum },
        (err, res) => {
          if (err) {
            reject(err);
          }
          resolve(res);
        }
      );
    });
    return res;
  }
  dispose() {
    this.db.close();
  }
}

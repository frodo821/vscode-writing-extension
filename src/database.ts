import sqlite3 from 'sql.js';
import { readFileSync, read } from 'fs';
import { Word, DatabaseConnector } from './database.types';
import { SqlJs } from 'sql.js/module';

const kataToHira: { [key: string]: string } = {
  ア: 'あ',
  イ: 'い',
  ウ: 'う',
  エ: 'え',
  オ: 'お',
  カ: 'か',
  キ: 'き',
  ク: 'く',
  ケ: 'け',
  コ: 'こ',
  サ: 'さ',
  シ: 'し',
  ス: 'す',
  セ: 'せ',
  ソ: 'そ',
  タ: 'た',
  チ: 'ち',
  ツ: 'つ',
  テ: 'て',
  ト: 'と',
  ナ: 'な',
  ニ: 'に',
  ヌ: 'ぬ',
  ネ: 'ね',
  ノ: 'の',
  ハ: 'は',
  ヒ: 'ひ',
  フ: 'ふ',
  ヘ: 'へ',
  ホ: 'ほ',
  マ: 'ま',
  ミ: 'み',
  ム: 'む',
  メ: 'め',
  モ: 'も',
  ヤ: 'や',
  ユ: 'ゆ',
  ヨ: 'よ',
  ラ: 'ら',
  リ: 'り',
  ル: 'る',
  レ: 'れ',
  ロ: 'ろ',
  ワ: 'わ',
  ヲ: 'を',
  ン: 'ん',
  ガ: 'が',
  ギ: 'ぎ',
  グ: 'ぐ',
  ゲ: 'げ',
  ゴ: 'ご',
  ザ: 'ざ',
  ジ: 'じ',
  ズ: 'ず',
  ゼ: 'ぜ',
  ゾ: 'ぞ',
  ダ: 'だ',
  ヂ: 'ぢ',
  ヅ: 'づ',
  デ: 'で',
  ド: 'ど',
  バ: 'ば',
  ビ: 'び',
  ブ: 'ぶ',
  ベ: 'べ',
  ボ: 'ぼ',
  パ: 'ぱ',
  ピ: 'ぴ',
  プ: 'ぷ',
  ペ: 'ぺ',
  ポ: 'ぽ',
  ャ: 'ゃ',
  ュ: 'ゅ',
  ョ: 'ょ',
  ッ: 'っ',
  ァ: 'ぁ',
  ィ: 'ぃ',
  ゥ: 'ぅ',
  ェ: 'ぇ',
  ォ: 'ぉ',
  ヮ: 'ゎ',
};

export default class Database implements DatabaseConnector {
  private db?: SqlJs.Database;
  private procedures: { [key: string]: SqlJs.Statement } = {};

  constructor(path: string) {
    sqlite3().then((it) => {
      this.db = new it.Database(readFileSync(path));
      this.procedures.getClsId = this.db.prepare(
        'SELECT classNum FROM words WHERE captionBody = :caption AND reading = :reading'
      );
      this.procedures.getThesaurus = this.db.prepare(
        'SELECT section, midItem, smallItem, captionBody, reading FROM words WHERE classNum = :clsId'
      );
    });
  }

  getThesaurus(caption: string, reading: string): Word[] {
    if (!this.db) {
      return [];
    }
    reading = this.convertKataWithHira(reading);
    const results =
      this.procedures.getClsId.get({
        ':caption': caption,
        ':reading': reading,
      }) ?? [];
    if (!results.some(() => true)) {
      return [];
    }
    this.procedures.getThesaurus.bind({ ':clsId': results[0] });
    const res: Word[] = [];
    while (this.procedures.getThesaurus.step()) {
      res.push((this.procedures.getThesaurus.getAsObject() as unknown) as Word);
    }
    this.procedures.getThesaurus.reset();
    return res;
  }

  convertKataWithHira(str: string) {
    return str
      .split('')
      .map((it) => kataToHira[it] ?? it)
      .join('');
  }

  dispose() {
    this.db?.close();
    Object.values(this.procedures).forEach((it) => it.free());
  }
}

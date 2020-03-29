import * as vscode from 'vscode';
import * as analyzer from 'kuromoji';
import { DatabaseConnector } from '../database.types';
import { Ref } from '../utils.types';

type Tokenizer = Ref<analyzer.Tokenizer<analyzer.IpadicFeatures>>;
type Database = Ref<DatabaseConnector>;

export default class CompletionItemProvider
  implements vscode.CompletionItemProvider {
  tokenizer: Tokenizer;
  database: Database;

  constructor(tokenizer: Tokenizer, database: Database) {
    this.tokenizer = tokenizer;
    this.database = database;
  }

  async provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
    context: vscode.CompletionContext
  ): Promise<vscode.CompletionItem[] | vscode.CompletionList | undefined> {
    if (!this.tokenizer.self || !this.database.self) {
      return;
    }
    const line = document.lineAt(position.line);
    const words = this.tokenizer.self.tokenize(line.text);
    let charPos = position.character + 2;
    let word = words.find((it) => {
      return (
        it.word_position <= charPos &&
        charPos <= it.word_position + it.surface_form.length
      );
    });
    if (!word) {
      return;
    }
    const thesaurus = await this.database.self.getThesaurus(
      word.basic_form,
      word.reading
    );
    const pos = new vscode.Position(position.line, word.word_position - 1);
    return thesaurus.map((it) => {
      return {
        insertText: it.captionBody,
        label: `${it.captionBody} (${it.reading})`,
        detail: `意味大分類: ${it.section}\n意味中分類: ${it.midItem}\n意味小分類: ${it.smallItem}`,
        range: new vscode.Range(
          pos,
          pos.translate({ characterDelta: word?.surface_form.length })
        ),
        kind: vscode.CompletionItemKind.Snippet,
      };
    });
  }
}

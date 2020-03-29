import * as vscode from 'vscode';
import * as analyzer from 'kuromoji';

type Tokenizer = { self?: analyzer.Tokenizer<analyzer.IpadicFeatures> };

export default class HoverProvider implements vscode.HoverProvider {
  tokenizer: Tokenizer;

  constructor(tokenizer: Tokenizer) {
    this.tokenizer = tokenizer;
  }

  provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.Hover> {
    const line = document.lineAt(position.line);
    const words = this.tokenizer.self?.tokenize(line.text);
    if (typeof words === 'undefined') {
      return Promise.reject();
    }
    let charPos = position.character + 2;
    let word = words.find((it) => {
      return (
        it.word_position <= charPos &&
        charPos <= it.word_position + it.surface_form.length
      );
    });
    if (!word) {
      return Promise.reject();
    }
    const pos = new vscode.Position(position.line, word.word_position - 1);
    return Promise.resolve(
      new vscode.Hover(
        word.basic_form,
        new vscode.Range(
          pos,
          pos.translate({ characterDelta: word.surface_form.length })
        )
      )
    );
  }
}

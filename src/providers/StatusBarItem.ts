import * as vscode from 'vscode';
import * as analyzer from 'kuromoji';
import constants from '../constants';

type Tokenizer = { self?: analyzer.Tokenizer<analyzer.IpadicFeatures> };

type AnalysisData = {
  length: number;
  diffs: number;
  nounRatio: number;
  verbRatio: number;
  adverbRatio: number;
  adjRatio: number;
  otherRatio: number;
};

const formatDecimal = (decimal: number, nDigits: number) => {
  const pow = Math.pow(10, nDigits);
  const [int, dec] = (Math.round(decimal * pow) / pow).toString().split('.', 2);
  return `${int}.${dec?.substr(0, nDigits) ?? '0'.repeat(nDigits)}`;
};

export default class StatusBarItem {
  item: vscode.StatusBarItem;
  handler?: vscode.Disposable;
  changeHandlers: vscode.Disposable[] = [];
  tokenizer: Tokenizer;
  data?: AnalysisData;
  private shown: boolean;
  private focusedEditorUri?: vscode.Uri;

  constructor(tokenizer: Tokenizer) {
    this.tokenizer = tokenizer;
    this.item = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right
    );
    this.shown = false;
    this.changeHandlers.push(
      vscode.window.onDidChangeVisibleTextEditors((its) => {
        const it = its.find(
          (it) => it.document.languageId === constants.languageId
        );
        if (!it) {
          this.hide();
          return;
        }
        this.show(it.document);
      })
    );
    this.handler = vscode.workspace.onDidChangeTextDocument((it) => {
      if (
        !this.shown ||
        !this.focusedEditorUri ||
        it.document.uri !== this.focusedEditorUri
      ) {
        return;
      }
      this.updateContent(it.document.getText());
    });
    this.changeHandlers.push(
      vscode.workspace.onDidOpenTextDocument((it) => {
        if (
          it.uri === this.focusedEditorUri &&
          it.languageId !== constants.languageId
        ) {
          this.hide();
          return;
        }
        if (this.shown || it.languageId !== constants.languageId) {
          return;
        }
        this.show(it);
      })
    );
  }

  show(document: vscode.TextDocument) {
    if (document.languageId !== constants.languageId) {
      return;
    }
    this.item.show();
    this.focusedEditorUri = document.uri;
    this.shown = true;
    this.updateContent(document.getText());
  }

  hide() {
    this.item.tooltip = '';
    this.item.text = '';
    this.item.hide();
    this.shown = false;
    this.focusedEditorUri = undefined;
  }

  private updateContent(text: string) {
    this.analyzeText(text).then((it) => {
      if (!it) {
        this.item.text = '準備中...';
        return;
      }
      this.item.text = `文字数: ${it.length}, 異なり形態素率: ${formatDecimal(
        it.diffs * 100,
        2
      )}%`;
      this.item.tooltip = `名詞率: ${formatDecimal(
        it.nounRatio * 100,
        2
      )}%\n動詞率: ${formatDecimal(
        it.verbRatio * 100,
        2
      )}%\n形容詞率: ${formatDecimal(
        it.adverbRatio * 100,
        2
      )}%\n副詞率: ${formatDecimal(
        it.adjRatio * 100,
        2
      )}%\nその他: ${formatDecimal(it.otherRatio * 100, 2)}`;
    });
  }

  private async analyzeText(text: string) {
    if (!this.tokenizer.self) {
      return;
    }
    const length = text.length;
    const words = this.tokenizer.self.tokenize(text);
    const nWords = words.length;
    const basics = words.map((it) => it.basic_form);
    const uniq = Array.from(new Set(basics));
    const diffs =
      uniq.filter((it) => basics.indexOf(it) === basics.lastIndexOf(it))
        .length / uniq.length;
    const nounRatio = words.filter((it) => it.pos === '名詞').length / nWords;
    const verbRatio = words.filter((it) => it.pos === '動詞').length / nWords;
    const adverbRatio =
      words.filter((it) => it.pos === '形容詞').length / nWords;
    const adjRatio = words.filter((it) => it.pos === '副詞').length / nWords;
    const otherRatio = 1 - nounRatio - verbRatio - adverbRatio - adjRatio;
    this.data = {
      length,
      diffs,
      nounRatio,
      verbRatio,
      adverbRatio,
      adjRatio,
      otherRatio,
    };
    return this.data;
  }

  dispose() {
    this.item.dispose();
    this.handler?.dispose();
    this.changeHandlers.forEach((it) => it.dispose());
  }
}

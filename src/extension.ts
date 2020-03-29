import * as analyzer from 'kuromoji';
import { join } from 'path';
import * as vscode from 'vscode';
import constants from './constants';
import Database from './database';
import { DatabaseConnector } from './database.types';
import CompletionItemProvider from './providers/CompletionItemProvider';
import HoverProvider from './providers/HoverProvider';
import StatusBarItem from './providers/StatusBarItem';
import { Ref, DisposableRef } from './utils.types';

const tokenizer: Ref<analyzer.Tokenizer<analyzer.IpadicFeatures>> = {};
const database: DisposableRef<DatabaseConnector> = {
  dispose: function() {
    this.self?.dispose();
  },
};
let channel: vscode.OutputChannel | null = null;

export function activate(context: vscode.ExtensionContext) {
  channel = vscode.window.createOutputChannel('Novel Writing Mode: Error');
  database.self = new Database(
    join(context.extensionPath, 'resources', 'dictionary.db')
  );

  vscode.window.showInformationMessage('Constructing analyzer...');
  analyzer
    .builder({ dicPath: join(context.extensionPath, 'resources', 'dict') })
    .build((err, t) => {
      if (err) {
        throw err;
      }
      tokenizer.self = t;
      vscode.window.showInformationMessage('Analyzer has been constructed!');
    });

  context.subscriptions.push(database);

  context.subscriptions.push(
    vscode.languages.registerHoverProvider(
      { language: constants.languageId },
      new HoverProvider(tokenizer)
    )
  );

  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      { language: constants.languageId },
      new CompletionItemProvider(tokenizer, database)
    )
  );

  context.subscriptions.push(new StatusBarItem(tokenizer));
  context.subscriptions.push(channel);
}

export function deactivate() {}

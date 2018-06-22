'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as _ from 'lodash';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('多语言提示已启动');

    let multilingualHint = new MultilingualHint();
    let regex = /regex/;

    //监听文件保存
    vscode.workspace.onDidSaveTextDocument(textDocument => {
        multilingualHint.updateMultilingual(textDocument);
    });

    //Register a hover provider.
    vscode.languages.registerHoverProvider(
        [{ scheme: 'file', language: 'typescript' }, { scheme: 'file', language: 'html' }],
        {
            provideHover(document: vscode.TextDocument, position: vscode.Position) {
                if (document.languageId === "typescript") {
                    regex = /getLang\(\s*'([^\s]+)'\s*\)/;
                } else if (document.languageId === "html") {
                    regex = /\s*'([^\s]+)'\s*\|\s*translate\b/;
                }
                let range = document.getWordRangeAtPosition(position, regex);
                if (range) {
                    let text = document.getText(range);
                    let result = (regex.exec(text) || [])[1];
                    if (result) {
                        return new vscode.Hover(_.get(multilingualHint.multilingual, result));
                    }
                }
                return null;
            }
        }
    );

    vscode.languages.registerCompletionItemProvider(
        [{ scheme: 'file', language: 'typescript' }, { scheme: 'file', language: 'html' }],
        {
            provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
                if (document.languageId === "typescript") {
                    return multilingualHint.ts_completionItemList;
                } else if (document.languageId === "html") {
                    return multilingualHint.html_completionItemList;
                }
            }
        }
    );
}


// this method is called when your extension is deactivated
export function deactivate() {

}

class MultilingualHint {

    public multilingual = {};//存储多语言信息
    public mhConfig = vscode.workspace.getConfiguration('multilingualhints');
    public fileName = "";//多语言文件路径
    public html_completionItemList: Array<vscode.CompletionItem> = [];
    public ts_completionItemList: Array<vscode.CompletionItem> = [];
    constructor() {
        this.fileName = vscode.workspace.rootPath + this.mhConfig.configFile;
        //加载多语言文件
        vscode.workspace.openTextDocument(this.fileName).then(document => {
            if (document === null) {
                return null;
            }
            this.updateMultilingual(document);
        });
    }

    /**
     * 更新多语言
     * @param document 
     */
    public updateMultilingual(document: vscode.TextDocument) {

        if (document.fileName === this.fileName) {
            try {
                this.multilingual = JSON.parse(document.getText());
                let html_completionItemList: Array<vscode.CompletionItem> = [];
                MultilingualHint.htmlParseJson(this.multilingual, '', html_completionItemList);
                this.html_completionItemList = html_completionItemList;

                let ts_completionItemList: Array<vscode.CompletionItem> = [];
                MultilingualHint.tsParseJson(this.multilingual, '', ts_completionItemList);
                this.ts_completionItemList = ts_completionItemList;
            } catch (error) {
                vscode.window.showErrorMessage('无效的多语言JSON格式');
            }
        }
    }
    public static tsParseJson(data: object, key: string, arr: Array<vscode.CompletionItem>) {
        _.forEach(_.toPairs(data), function (v, k) {
            if (_.isObject(v[1])) {
                MultilingualHint.tsParseJson(v[1], key + v[0] + '.', arr);
            } else {
                let item = new vscode.CompletionItem(key + v[0] + ' ' + v[1]);
                item.insertText = "this.appData.getLang('" + key + v[0] + "')";
                arr.push(item);
            }
        });
    }
    public static htmlParseJson(data: object, key: string, arr: Array<vscode.CompletionItem>) {
        _.forEach(_.toPairs(data), function (v, k) {
            if (_.isObject(v[1])) {
                MultilingualHint.htmlParseJson(v[1], key + v[0] + '.', arr);
            } else {
                let item = new vscode.CompletionItem(key + v[0] + ' ' + v[1]);
                item.insertText = "'" + key + v[0] + "' | translate";
                arr.push(item);
            }
        });
    }

    dispose() {

    }
}

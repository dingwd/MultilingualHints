'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('多语言提示已启动');

    let multilingualHint = new MultilingualHint();

    //监听文件保存
    vscode.workspace.onDidSaveTextDocument(textDocument => {
        multilingualHint.updateMultilingual(textDocument);
    });

    //Register a hover provider.
    vscode.languages.registerHoverProvider(['javascript', 'html'], {
        provideHover(document, position, token) {
            let range = document.getWordRangeAtPosition(position);
            let text = document.getText(range);
            if (text.startsWith(multilingualHint.mhConfig.prefix)) {
                let descriptor = Object.getOwnPropertyDescriptor(multilingualHint.multilingual, text);
                if (descriptor) {
                    return new vscode.Hover(descriptor.value);
                }
            }
            return null;
        }
    });
}



// this method is called when your extension is deactivated
export function deactivate() {

}

class MultilingualHint {

    public multilingual = {};//存储多语言信息
    public mhConfig = vscode.workspace.getConfiguration('multilingualhints');
    private fileName = "";//多语言文件路径

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
            } catch (error) {
                vscode.window.showErrorMessage('无效的多语言JSON格式');
            }
        }
    }

    dispose() {

    }
}

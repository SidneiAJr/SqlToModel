// src/extension.ts
import * as vscode from 'vscode';
import { converterTs } from './generators/SqlToTS';
import { converterJavaLombok } from './generators/SqlTojavalomok';  
import { converterJavaNormal } from './generators/sqltojavaNormal';  // ✅ nome correto
import { converterJs } from './generators/SqlToJs';

export function activate(context: vscode.ExtensionContext) {
    const disposable = vscode.commands.registerCommand('sql-to-model.converter', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('Abra um arquivo com SQL primeiro');
            return;
        }

        const sqlSelecionado = editor.document.getText(editor.selection);
        if (!sqlSelecionado || !sqlSelecionado.toLowerCase().includes('create table')) {
            vscode.window.showErrorMessage('Selecione um comando CREATE TABLE SQL válido');
            return;
        }

        // PASSO 1: ESCOLHER LINGUAGEM
        // ✅ C# removido até estar implementado
        const linguagem = await vscode.window.showQuickPick(
            ['TypeScript', 'JavaScript', 'Java (com Lombok)', 'Java (sem Lombok)'],
            { placeHolder: 'Para qual linguagem converter o model?' }
        );

        if (!linguagem) return;

        let resultado = '';

        switch (linguagem) {
            case 'TypeScript':
                resultado = converterTs(sqlSelecionado);
                break;
            case 'JavaScript':
                resultado = converterJs(sqlSelecionado);
                break;
            case 'Java (com Lombok)':
                resultado = converterJavaLombok(sqlSelecionado);
                break;
            case 'Java (sem Lombok)':
                resultado = converterJavaNormal(sqlSelecionado);
                break;
        }

        // ✅ Abre novo documento em vez de inserir no arquivo SQL
        // Evita output duplicado e não polui o arquivo original
        if (resultado) {
            const extensao = linguagem.includes('Java') ? 'java' : linguagem === 'TypeScript' ? 'ts' : 'js';
            const doc = await vscode.workspace.openTextDocument({
                content: resultado,
                language: extensao
            });
            await vscode.window.showTextDocument(doc);
            vscode.window.showInformationMessage(`✅ Model ${linguagem} gerado!`);
        }
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}
// src/extension.ts
import * as vscode from 'vscode';
import { converterTs } from './generators/SqlToTS';
import { converterJavaLombok } from './generators/SqlTojavalomok';  
import { converterJavaNormal } from './generators/sqltojavaNormal';
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
        const linguagem = await vscode.window.showQuickPick(
            ['TypeScript', 'JavaScript', 'Java (com Lombok)', 'Java (sem Lombok)'],
            { placeHolder: 'Para qual linguagem converter o model?' }
        );

        if (!linguagem) return;

        let resultado = '';

        // 🔥 SE FOR TS, PERGUNTAR SE QUER INTERFACE OU CLASSE
        if (linguagem === 'TypeScript') {
            const tsOutputType = await vscode.window.showQuickPick(
                ['Interface (recomendado para frontend/API)', 'Classe (recomendado para backend/ORM)'],
                { placeHolder: 'Tipo de saída para TypeScript?' }
            );

            if (!tsOutputType) return;

            const isClass = tsOutputType.includes('Classe');
            resultado = converterTs(sqlSelecionado, isClass ? 'class' : 'interface');
        } else {
            switch (linguagem) {
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
        }

        // Abre novo documento
        if (resultado) {
            let extensao = 'txt';
            if (linguagem === 'TypeScript') extensao = 'ts';
            else if (linguagem === 'JavaScript') extensao = 'js';
            else if (linguagem.includes('Java')) extensao = 'java';

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
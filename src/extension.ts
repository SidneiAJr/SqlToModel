// src/extension.ts
import * as vscode from 'vscode';
import { converterTs } from './generators/SqlToTS';
import { converterJavaLombok } from './generators/SqlTojavalomok';  // ← confira o nome do arquivo
import { converterJavaNormal } from './generators/sqltojavaNormal';  // ← ADICIONAR
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
            ['TypeScript', 'JavaScript', 'Java', 'C#'],
            { placeHolder: 'Para qual linguagem converter o model?' }
        );
        
        if (!linguagem) return;
        
        let resultado = '';
        
        // PASSO 2: SE FOR JAVA, PERGUNTAR QUAL ESTILO
        if (linguagem === 'Java') {
            const estiloJava = await vscode.window.showQuickPick(
                [
                    'Java com Lombok (recomendado)',
                    'Java sem Lombok (getters/setters manuais)'
                ],
                { placeHolder: 'Qual estilo de Java você prefere?' }
            );
            
            if (!estiloJava) return;
            
            if (estiloJava.includes('Lombok')) {
                resultado = converterJavaLombok(sqlSelecionado);
            } else {
                resultado = converterJavaNormal(sqlSelecionado);
            }
        } 
        // PASSO 3: OUTRAS LINGUAGENS
        else {
            switch (linguagem) {
                case 'TypeScript':
                    resultado = converterTs(sqlSelecionado);
                    break;
                case 'JavaScript':
                    resultado = converterJs(sqlSelecionado);
                    break;
                case 'C#':
                    // TODO: implementar converterCSharp
                    vscode.window.showErrorMessage('C# ainda não implementado');
                    return;
            }
        }
        
        // PASSO 4: INSERIR NO EDITOR
        if (resultado) {
            editor.edit(editBuilder => {
                editBuilder.insert(editor.selection.active, resultado);
            });
            vscode.window.showInformationMessage(`✅ Model ${linguagem} gerado!`);
        }
    });
    
    context.subscriptions.push(disposable);
}

export function deactivate() {}
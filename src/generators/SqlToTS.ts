// src/generators/SqlToTS.ts
import { parseCreateTable } from '../parser/sqlParser';

function toCamelCase(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function capitalizar(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function mapearTipoTs(col: any): string {
    const tipoUpper = col.tipo.toUpperCase();
    
    if (col.enumValues) return `${capitalizar(col.nome)}Enum`;
    if (tipoUpper.includes('INT')) return 'number';
    if (tipoUpper.includes('VARCHAR') || tipoUpper.includes('TEXT')) return 'string';
    if (tipoUpper.includes('DATE') || tipoUpper.includes('TIMESTAMP')) return 'Date';
    if (tipoUpper.includes('DECIMAL') || tipoUpper.includes('FLOAT')) return 'number';
    if (tipoUpper.includes('BOOLEAN')) return 'boolean';
    if (tipoUpper.includes('JSON')) return 'Record<string, any>';
    return 'any';
}

export function converterTs(sql: string): string {
    const tabelaInfo = parseCreateTable(sql);
    const { nome, colunas } = tabelaInfo;
    const nomeInterface = capitalizar(toCamelCase(nome));
    
    let output = `// Gerado automaticamente de SQL\n\n`;
    
    // Gerar enums primeiro
    const enums = colunas.filter(col => col.enumValues && col.enumValues.length > 0);
    for (const enumCol of enums) {
        const enumName = `${capitalizar(toCamelCase(enumCol.nome))}Enum`;
        output += `export enum ${enumName} {\n`;
        for (const val of enumCol.enumValues!) {
            output += `    ${val.toUpperCase()} = '${val}',\n`;
        }
        output += `}\n\n`;
    }
    
    // Gerar interface
    output += `export interface ${nomeInterface} {\n`;
    for (const col of colunas) {
        const tipoTs = mapearTipoTs(col);
        const nomeCampo = toCamelCase(col.nome);
        const opcional = col.notNull || col.isPrimaryKey ? '' : '?';
        output += `    ${nomeCampo}${opcional}: ${tipoTs};\n`;
    }
    output += `}\n`;
    
    return output;
}
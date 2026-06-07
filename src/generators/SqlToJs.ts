// src/generators/SqlToJs.ts
import { parseCreateTable } from '../parser/sqlParser';

function toCamelCase(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function capitalizar(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function getDefaultValue(col: any): string {
    if (col.defaultValue) {
        if (col.defaultValue === 'CURRENT_TIMESTAMP') return 'new Date()';
        if (col.defaultValue === 'TRUE') return 'true';
        if (col.defaultValue === 'FALSE') return 'false';
        if (!isNaN(Number(col.defaultValue))) return col.defaultValue; // número sem aspas
        return `'${col.defaultValue}'`;
    }
    if (col.isPrimaryKey) return 'null';
    if (col.tipo.includes('BOOLEAN')) return 'false';
    if (col.tipo.includes('INT')) return '0';
    if (col.tipo.includes('DECIMAL') || col.tipo.includes('FLOAT')) return '0';
    if (col.tipo.includes('VARCHAR') || col.tipo.includes('TEXT')) return "''";
    if (col.tipo.includes('TIMESTAMP') || col.tipo.includes('DATE')) return 'null';
    return 'null';
}

export function converterJs(sql: string): string {
    const tabelaInfo = parseCreateTable(sql);
    const { nome, colunas } = tabelaInfo;
    const nomeClasse = capitalizar(toCamelCase(nome));

    let output = `// Gerado automaticamente de SQL\n\n`;

    // Gerar enums como objetos
    const enums = colunas.filter(col => col.enumValues && col.enumValues.length > 0);
    for (const enumCol of enums) {
        const enumName = `${capitalizar(toCamelCase(enumCol.nome))}Enum`;
        output += `const ${enumName} = {\n`;
        for (const val of enumCol.enumValues!) {
            output += `    ${val.toUpperCase()}: '${val}',\n`;
        }
        output += `};\n\n`;
    }

    // Gerar classe
    output += `class ${nomeClasse} {\n`;
    output += `    constructor(data = {}) {\n`;
    for (const col of colunas) {
        const nomeCampo = toCamelCase(col.nome);
        const defaultValue = getDefaultValue(col);
        output += `        this.${nomeCampo} = data.${nomeCampo} ?? ${defaultValue};\n`;
    }
    output += `    }\n`;
    output += `}\n\n`;
    output += `module.exports = { ${nomeClasse} };\n`;

    return output;
}
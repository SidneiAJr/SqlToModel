// src/utils/javaUtils.ts
import { Coluna } from '../parser/sqlParser';

export function toCamelCase(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

export function capitalizarCamelCase(str: string): string {
    return str.split('_')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join('');
}

export function capitalizarPrimeira(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export function mapearTipoJava(col: Coluna): string {
    const tipoUpper = col.tipo.toUpperCase();
    
    // Usar enumValues para detectar ENUM
    if (col.enumValues && col.enumValues.length > 0) return capitalizarCamelCase(col.nome);
    
    if (tipoUpper.includes('BIGINT')) return 'Long';
    if (tipoUpper.includes('INT')) return 'Integer';
    if (tipoUpper.includes('SMALLINT')) return 'Integer';
    if (tipoUpper.includes('TINYINT')) return 'Integer';
    if (tipoUpper.includes('DECIMAL')) return 'BigDecimal';
    if (tipoUpper.includes('NUMERIC')) return 'BigDecimal';
    if (tipoUpper.includes('FLOAT')) return 'Double';
    if (tipoUpper.includes('DOUBLE')) return 'Double';
    if (tipoUpper.includes('VARCHAR')) return 'String';
    if (tipoUpper.includes('CHAR')) return 'String';
    if (tipoUpper.includes('TEXT')) return 'String';
    if (tipoUpper.includes('TIMESTAMP')) return 'LocalDateTime';
    if (tipoUpper.includes('DATETIME')) return 'LocalDateTime';
    if (tipoUpper.includes('DATE')) return 'LocalDate';
    if (tipoUpper.includes('TIME')) return 'LocalTime';
    if (tipoUpper.includes('BOOLEAN')) return 'Boolean';
    if (tipoUpper.includes('BIT')) return 'Boolean';
    if (tipoUpper.includes('JSON')) return 'String';
    if (tipoUpper.includes('VARBINARY')) return 'byte[]';
    if (tipoUpper.includes('BLOB')) return 'byte[]';
    
    return 'String';
}

export function extrairEnums(colunas: Coluna[]): Coluna[] {
    return colunas.filter(col => col.enumValues && col.enumValues.length > 0);
}

export function gerarEnum(enumCol: Coluna): string {
    const enumName = capitalizarCamelCase(enumCol.nome);
    const valores = enumCol.enumValues || [];
    
    let output = `public enum ${enumName} {\n`;
    for (const val of valores) {
        output += `    ${val.toUpperCase()},\n`;
    }
    output += `}`;
    return output;
}

export function getImports(colunas: Coluna[]): Set<string> {
    const imports = new Set<string>();
    for (const col of colunas) {
        const tipoJava = mapearTipoJava(col);
        if (tipoJava === 'LocalDateTime') imports.add('java.time.LocalDateTime');
        if (tipoJava === 'LocalDate') imports.add('java.time.LocalDate');
        if (tipoJava === 'LocalTime') imports.add('java.time.LocalTime');
        if (tipoJava === 'BigDecimal') imports.add('java.math.BigDecimal');
    }
    return imports;
}
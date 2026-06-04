// src/parser/sqlParser.ts

export interface Coluna {
    nome: string;
    tipo: string;
    tipoCompleto: string;      // Tipo original com parâmetros (ex: VARCHAR(255))
    notNull: boolean;
    unique: boolean;
    isPrimaryKey: boolean;
    autoIncrement: boolean;
    unsigned: boolean;
    zerofill: boolean;
    defaultValue?: string | null;
    onUpdate?: string;          // ON UPDATE CURRENT_TIMESTAMP
    charset?: string;
    collate?: string;
    comment?: string;
    afterColumn?: string;       // AFTER coluna (MySQL)
    virtual?: boolean;           // COLUMN GENERATED ALWAYS
    stored?: boolean;            // STORED | VIRTUAL
    enumValues?: string[];       // Para ENUM
    precision?: number;          // DECIMAL(10,2) -> precision = 10
    scale?: number;              // DECIMAL(10,2) -> scale = 2
    length?: number;             // VARCHAR(255) -> length = 255
}

export interface Constraint {
    tipo: 'PRIMARY_KEY' | 'FOREIGN_KEY' | 'UNIQUE_KEY' | 'CHECK';
    nome?: string;
    colunas: string[];
    referenciaTabela?: string;
    referenciaColunas?: string[];
    onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
    onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
    condicao?: string;          // Para CHECK
}

export interface Index {
    nome: string;
    tipo: 'INDEX' | 'UNIQUE' | 'FULLTEXT' | 'SPATIAL';
    colunas: string[];
    usando?: 'BTREE' | 'HASH';
}

export interface TabelaInfo {
    nome: string;
    colunas: Coluna[];
    constraints: Constraint[];
    indexes: Index[];
    engine?: string;
    charset?: string;
    collate?: string;
    rowFormat?: 'DYNAMIC' | 'FIXED' | 'COMPRESSED' | 'REDUNDANT' | 'COMPACT';
    comment?: string;
    autoIncrementStart?: number;
}

// ============================================
// PARSER PRINCIPAL
// ============================================

export function parseCreateTable(sql: string): TabelaInfo {
    // Remove quebras de linha e espaços extras
    sql = sql.replace(/\s+/g, ' ').trim();
    
    // Extrai nome da tabela
    const tabelaMatch = sql.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)/i);
    const nomeTabela = tabelaMatch ? tabelaMatch[1] : 'Tabela';
    
    // Extrai configurações do final (ENGINE, CHARSET, etc)
    const engineMatch = sql.match(/ENGINE=(\w+)/i);
    const charsetMatch = sql.match(/CHARSET=(\w+)/i);
    const collateMatch = sql.match(/COLLATE=(\w+)/i);
    const rowFormatMatch = sql.match(/ROW_FORMAT=(\w+)/i);
    const commentMatch = sql.match(/COMMENT=['"]([^'"]+)['"]/i);
    
    // Pega tudo entre parenteses (considerando parenteses aninhados)
    const parenMatch = sql.match(/\(([\s\S]*)\)/);
    if (!parenMatch) {
        return {
            nome: nomeTabela,
            colunas: [],
            constraints: [],
            indexes: []
        };
    }
    
    const conteudo = parenMatch[1];
    
    // Split inteligente: quebra em vírgula que NÃO está dentro de parenteses
    const partes = splitByTopLevelCommas(conteudo);
    
    const colunas: Coluna[] = [];
    const constraints: Constraint[] = [];
    const indexes: Index[] = [];
    
    for (const parte of partes) {
        const trimmed = parte.trim();
        if (!trimmed) continue;
        
        // Detecta tipo da definição
        if (isPrimaryKeyDefinition(trimmed)) {
            constraints.push(parsePrimaryKey(trimmed));
        } 
        else if (isForeignKeyDefinition(trimmed)) {
            constraints.push(parseForeignKey(trimmed));
        }
        else if (isUniqueKeyDefinition(trimmed)) {
            constraints.push(parseUniqueKey(trimmed));
        }
        else if (isCheckDefinition(trimmed)) {
            constraints.push(parseCheckConstraint(trimmed));
        }
        else if (isIndexDefinition(trimmed)) {
            indexes.push(parseIndex(trimmed));
        }
        else {
            // É uma definição de coluna
            const coluna = parseColumnDefinition(trimmed);
            if (coluna) {
                colunas.push(coluna);
            }
        }
    }
    
    return {
        nome: nomeTabela,
        colunas,
        constraints,
        indexes,
        engine: engineMatch?.[1],
        charset: charsetMatch?.[1],
        collate: collateMatch?.[1],
        rowFormat: rowFormatMatch?.[1] as any,
        comment: commentMatch?.[1]
    };
}

// ============================================
// UTILITÁRIOS
// ============================================

function splitByTopLevelCommas(str: string): string[] {
    const result: string[] = [];
    let current = '';
    let parenLevel = 0;
    let inQuote = false;
    let quoteChar = '';
    
    for (let i = 0; i < str.length; i++) {
        const ch = str[i];
        
        // Lida com strings entre aspas
        if ((ch === "'" || ch === '"') && str[i-1] !== '\\') {
            if (!inQuote) {
                inQuote = true;
                quoteChar = ch;
            } else if (ch === quoteChar) {
                inQuote = false;
            }
        }
        
        if (!inQuote) {
            if (ch === '(') parenLevel++;
            if (ch === ')') parenLevel--;
            
            if (ch === ',' && parenLevel === 0) {
                result.push(current);
                current = '';
                continue;
            }
        }
        
        current += ch;
    }
    
    if (current) result.push(current);
    return result;
}

function isPrimaryKeyDefinition(str: string): boolean {
    return /^PRIMARY\s+KEY/i.test(str);
}

function isForeignKeyDefinition(str: string): boolean {
    return /^FOREIGN\s+KEY/i.test(str);
}

function isUniqueKeyDefinition(str: string): boolean {
    return /^UNIQUE\s+KEY/i.test(str) || /^UNIQUE\s+INDEX/i.test(str) || /^UNIQUE\b/i.test(str);
}

function isCheckDefinition(str: string): boolean {
    return /^CONSTRAINT.*CHECK\s*\(/i.test(str) || /^CHECK\s*\(/i.test(str);
}

function isIndexDefinition(str: string): boolean {
    return /^INDEX\s+\w+/i.test(str) || /^KEY\s+\w+/i.test(str) || /^FULLTEXT\s+INDEX/i.test(str) || /^SPATIAL\s+INDEX/i.test(str);
}

// ============================================
// PARSER DE COLUNA (O MAIS COMPLETO)
// ============================================

function parseColumnDefinition(def: string): Coluna | null {
    // Remove constraints inline como PRIMARY KEY, UNIQUE, etc
    let cleanDef = def.trim();
    
    // Extrai nome da coluna (primeira palavra)
    const nomeMatch = cleanDef.match(/^(\w+)/);
    if (!nomeMatch) return null;
    const nome = nomeMatch[1];
    
    // Extrai tipo (segunda palavra + possíveis parenteses)
    const tipoMatch = cleanDef.match(/^\w+\s+(\w+(?:\([^)]+\))?)/i);
    if (!tipoMatch) return null;
    
    let tipo = tipoMatch[1];
    const tipoCompleto = tipo;
    
    // Remove parâmetros para o tipo base
    let tipoBase = tipo.split('(')[0].toUpperCase();
    
    // Extrai parâmetros do tipo
    let length: number | undefined;
    let precision: number | undefined;
    let scale: number | undefined;
    let enumValues: string[] | undefined;
    
    const parenMatch = tipo.match(/\(([^)]+)\)/);
    if (parenMatch) {
        const params = parenMatch[1];
        if (tipoBase === 'ENUM') {
            enumValues = params.split(',').map(v => v.trim().replace(/'/g, ''));
        } 
        else if (tipoBase === 'DECIMAL' || tipoBase === 'NUMERIC') {
            const [p, s] = params.split(',');
            precision = parseInt(p);
            scale = s ? parseInt(s) : 0;
        }
        else if (tipoBase === 'VARCHAR' || tipoBase === 'CHAR') {
            length = parseInt(params);
        }
        else if (tipoBase === 'INT' || tipoBase === 'BIGINT' || tipoBase === 'TINYINT' || tipoBase === 'SMALLINT') {
            length = parseInt(params);
        }
    }
    
    // Propriedades da coluna
    const notNull = /\bNOT\s+NULL\b/i.test(cleanDef);
    const unique = /\bUNIQUE\b/i.test(cleanDef);
    const isPrimaryKey = /\bPRIMARY\s+KEY\b/i.test(cleanDef);
    const autoIncrement = /\bAUTO_INCREMENT\b/i.test(cleanDef);
    const unsigned = /\bUNSIGNED\b/i.test(cleanDef);
    const zerofill = /\bZEROFILL\b/i.test(cleanDef);
    
    // DEFAULT
    let defaultValue: string | undefined;
    const defaultMatch = cleanDef.match(/\bDEFAULT\s+(['"]?)([^'",\s)]+)\1/i);
    if (defaultMatch) {
        defaultValue = defaultMatch[2];
        if (defaultValue === 'CURRENT_TIMESTAMP') defaultValue = 'CURRENT_TIMESTAMP';
    }
    
    // ON UPDATE
    let onUpdate: string | undefined;
    const onUpdateMatch = cleanDef.match(/\bON\s+UPDATE\s+(CURRENT_TIMESTAMP(?:_\d+)?)/i);
    if (onUpdateMatch) onUpdate = onUpdateMatch[1];
    
    // GENERATED COLUMN
    let virtual = false;
    let stored = false;
    if (/\bGENERATED\s+ALWAYS\s+AS\b/i.test(cleanDef)) {
        if (/\bSTORED\b/i.test(cleanDef)) stored = true;
        if (/\bVIRTUAL\b/i.test(cleanDef)) virtual = true;
    }
    
    // AFTER column (MySQL)
    let afterColumn: string | undefined;
    const afterMatch = cleanDef.match(/\bAFTER\s+(\w+)/i);
    if (afterMatch) afterColumn = afterMatch[1];
    
    // COMMENT
    let comment: string | undefined;
    const commentMatch = cleanDef.match(/\bCOMMENT\s+['"]([^'"]+)['"]/i);
    if (commentMatch) comment = commentMatch[1];
    
    // CHARSET / COLLATE
    let charset: string | undefined;
    let collate: string | undefined;
    const charsetMatch = cleanDef.match(/\bCHARACTER\s+SET\s+(\w+)/i);
    const collateMatch = cleanDef.match(/\bCOLLATE\s+(\w+)/i);
    if (charsetMatch) charset = charsetMatch[1];
    if (collateMatch) collate = collateMatch[1];
    
    return {
        nome,
        tipo: tipoBase,
        tipoCompleto,
        notNull,
        unique,
        isPrimaryKey,
        autoIncrement,
        unsigned,
        zerofill,
        defaultValue,
        onUpdate,
        virtual,
        stored,
        enumValues,
        precision,
        scale,
        length,
        afterColumn,
        comment,
        charset,
        collate
    };
}

// ============================================
// PARSER DE CONSTRAINTS
// ============================================

function parsePrimaryKey(def: string): Constraint {
    const nomeMatch = def.match(/CONSTRAINT\s+(\w+)/i);
    const colunasMatch = def.match(/PRIMARY\s+KEY\s*\(([^)]+)\)/i);
    const colunas = colunasMatch ? colunasMatch[1].split(',').map(c => c.trim()) : [];
    
    return {
        tipo: 'PRIMARY_KEY',
        nome: nomeMatch?.[1],
        colunas
    };
}

function parseForeignKey(def: string): Constraint {
    const nomeMatch = def.match(/CONSTRAINT\s+(\w+)/i);
    const colunasMatch = def.match(/FOREIGN\s+KEY\s*\(([^)]+)\)/i);
    const referenciaMatch = def.match(/REFERENCES\s+(\w+)\s*\(([^)]+)\)/i);
    const onDeleteMatch = def.match(/ON\s+DELETE\s+(CASCADE|SET\s+NULL|RESTRICT|NO\s+ACTION)/i);
    const onUpdateMatch = def.match(/ON\s+UPDATE\s+(CASCADE|SET\s+NULL|RESTRICT|NO\s+ACTION)/i);
    
    const colunas = colunasMatch ? colunasMatch[1].split(',').map(c => c.trim()) : [];
    const referenciaTabela = referenciaMatch?.[1];
    const referenciaColunas = referenciaMatch?.[2]?.split(',').map(c => c.trim());
    
    return {
        tipo: 'FOREIGN_KEY',
        nome: nomeMatch?.[1],
        colunas,
        referenciaTabela,
        referenciaColunas,
        onDelete: onDeleteMatch?.[1].replace(/\s+/g, '_').toUpperCase() as any,
        onUpdate: onUpdateMatch?.[1].replace(/\s+/g, '_').toUpperCase() as any
    };
}

function parseUniqueKey(def: string): Constraint {
    const nomeMatch = def.match(/CONSTRAINT\s+(\w+)/i);
    const colunasMatch = def.match(/UNIQUE\s+(?:KEY|INDEX)?\s*(?:\w+\s*)?\(([^)]+)\)/i);
    const colunas = colunasMatch ? colunasMatch[1].split(',').map(c => c.trim()) : [];
    
    return {
        tipo: 'UNIQUE_KEY',
        nome: nomeMatch?.[1] || def.match(/UNIQUE\s+KEY\s+(\w+)/i)?.[1],
        colunas
    };
}

function parseCheckConstraint(def: string): Constraint {
    const nomeMatch = def.match(/CONSTRAINT\s+(\w+)/i);
    const checkMatch = def.match(/CHECK\s*\(([^)]+)\)/i);
    
    return {
        tipo: 'CHECK',
        nome: nomeMatch?.[1],
        colunas: [],
        condicao: checkMatch?.[1]
    };
}

function parseIndex(def: string): Index {
    const nomeMatch = def.match(/(?:INDEX|KEY|FULLTEXT|SPATIAL)\s+(\w+)/i);
    const colunasMatch = def.match(/\(([^)]+)\)/);
    const usandoMatch = def.match(/USING\s+(\w+)/i);
    
    let tipo: Index['tipo'] = 'INDEX';
    if (/FULLTEXT/i.test(def)) tipo = 'FULLTEXT';
    if (/SPATIAL/i.test(def)) tipo = 'SPATIAL';
    if (/UNIQUE/i.test(def)) tipo = 'UNIQUE';
    
    const colunas = colunasMatch ? colunasMatch[1].split(',').map(c => c.trim()) : [];
    
    return {
        nome: nomeMatch?.[1] || 'unknown',
        tipo,
        colunas,
        usando: usandoMatch?.[1] as any
    };
}
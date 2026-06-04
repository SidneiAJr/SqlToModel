// src/generators/SqlToJavaLombok.ts
import { parseCreateTable } from '../parser/sqlParser';
import { 
    toCamelCase, 
    capitalizarCamelCase, 
    mapearTipoJava, 
    extrairEnums, 
    gerarEnum,
    getImports 
} from '../utils/javaUtils';

export function converterJavaLombok(sql: string): string {
    const tabelaInfo = parseCreateTable(sql);
    const { nome, colunas } = tabelaInfo;
    const nomeClasse = capitalizarCamelCase(nome);
    
    let output = `// Gerado automaticamente de SQL\n`;
    output += `// Requer Lombok: https://projectlombok.org/setup\n\n`;
    
    output += `import jakarta.persistence.*;\n`;
    output += `import lombok.Data;\n`;
    output += `import lombok.NoArgsConstructor;\n`;
    output += `import lombok.AllArgsConstructor;\n`;
    output += `import lombok.Builder;\n`;
    
    const imports = getImports(colunas);
    for (const imp of imports) {
        output += `import ${imp};\n`;
    }
    
    output += `\n@Entity\n`;
    output += `@Table(name = "${nome.toLowerCase()}")\n`;
    output += `@Data\n`;
    output += `@NoArgsConstructor\n`;
    output += `@AllArgsConstructor\n`;
    output += `@Builder\n`;
    output += `public class ${nomeClasse} {\n\n`;
    
    for (const col of colunas) {
        const annotations: string[] = [];
        
        if (col.isPrimaryKey) {
            annotations.push(`    @Id`);
            annotations.push(`    @GeneratedValue(strategy = GenerationType.IDENTITY)`);
        }
        
        // Se for ENUM, adiciona @Enumerated
        if (col.enumValues && col.enumValues.length > 0) {
            annotations.push(`    @Enumerated(EnumType.STRING)`);
        }
        
        // Configuração da @Column
        const columnAttrs: string[] = [];
        if (col.nome !== col.nome.toLowerCase()) {
            columnAttrs.push(`name = "${col.nome}"`);
        }
        if (col.notNull) {
            columnAttrs.push(`nullable = false`);
        }
        if (col.unique && !col.isPrimaryKey) {
            columnAttrs.push(`unique = true`);
        }
        if (col.length) {
            columnAttrs.push(`length = ${col.length}`);
        }
        if (col.unsigned) {
            columnAttrs.push(`columnDefinition = "${col.tipoCompleto.toUpperCase()} UNSIGNED"`);
        }
        if (col.tipo === 'JSON') {
            columnAttrs.push(`columnDefinition = "JSON"`);
        }
        if (col.tipo === 'VARBINARY' && col.length) {
            columnAttrs.push(`columnDefinition = "VARBINARY(${col.length})"`);
        }
        
        if (columnAttrs.length > 0) {
            annotations.push(`    @Column(${columnAttrs.join(', ')})`);
        } else if (!col.isPrimaryKey) {
            annotations.push(`    @Column`);
        }
        
        for (const ann of annotations) {
            output += `${ann}\n`;
        }
        
        const nomeCampo = toCamelCase(col.nome);
        const tipoJava = mapearTipoJava(col);
        
        output += `    private ${tipoJava} ${nomeCampo};\n\n`;
    }
    
    output += `}\n`;
    
    const enums = extrairEnums(colunas);
    for (const enumDef of enums) {
        output += `\n${gerarEnum(enumDef)}\n`;
    }
    
    return output;
}
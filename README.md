# 🗄️ SQL to Model

> **Converte CREATE TABLE SQL diretamente em Model/Entity na sua linguagem favorita**

[![Version](https://img.shields.io/badge/version-0.0.1-blue.svg)](https://marketplace.visualstudio.com/items?itemName=SidneiAJr.sql-to-model)
[![VS Code](https://img.shields.io/badge/VS%20Code-1.85.0+-blue.svg)](https://code.visualstudio.com)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

---

## 🎯 O que faz

Selecione um `CREATE TABLE` SQL e converta para:

| Linguagem | Formato |
|-----------|---------|
| **TypeScript** | Interface |
| **JavaScript** | Classe CommonJS |
| **Java (Lombok)** | Entidade JPA com `@Data`, `@Builder` |
| **Java (Normal)** | Entidade JPA com getters/setters manuais |
| **Markdown** | Documentação GitHub pronta |

---

## 📦 Instalação

1. Abra o VS Code
2. Pressione `Ctrl+Shift+X` (ou `Cmd+Shift+X` no Mac)
3. Pesquise: `SQL to Model`
4. Clique em **Install**

## 🚀 Como usar
```sql
CREATE TABLE usuarios (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    ativo BOOLEAN DEFAULT TRUE
);
```

## Passo 2 — Converta

- Pressione Ctrl+Shift+P (ou Cmd+Shift+P)
- Digite: SQL to Model: Converter
- Escolha o formato desejado

# 🗄️ SQL to Model

> Converts `CREATE TABLE` SQL directly into a Model/Entity in your favorite language.

[![Version](https://img.shields.io/badge/version-0.0.1-blue.svg)](https://marketplace.visualstudio.com/items?itemName=SidneiAJr.sql-to-model)
[![VS Code](https://img.shields.io/badge/VS%20Code-1.85.0+-blue.svg)](https://code.visualstudio.com)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

---

## ⚠️ Status

> Version 0.0.1 — tested primarily with **MySQL/MariaDB**

| Database | Support |
|----------|---------|
| MySQL / MariaDB | ✅ Full |
| PostgreSQL | ⚠️ Partial (basic types only) |
| SQL Server | ⚠️ Partial |
| Oracle | ❌ Not tested |

Coming soon: full PostgreSQL, SQLite, arrays and JSON support.

---

## 🎯 What it does

Select a `CREATE TABLE` statement and convert it to:

| Language | Output |
|----------|--------|
| **TypeScript** | Interface |
| **JavaScript** | CommonJS Class |
| **Java (Lombok)** | JPA Entity with `@Data`, `@Builder` |
| **Java (Normal)** | JPA Entity with manual getters/setters |
| **Markdown** | GitHub-ready documentation table |

---

## 🚀 How to use

1. Write or paste a `CREATE TABLE` in any file
2. `Ctrl+Shift+P` → `SQL to Model: Convert`
3. Choose the output format
4. Done — the model is generated instantly

---

## 📋 Example

**Input:**

```sql
CREATE TABLE usuarios (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Output — TypeScript:**

```typescript
export interface Usuarios {
    id: number;
    nome: string;
    email: string;
    ativo: boolean;
    criado_em: Date;
}
```

**Output — Markdown:**

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | BIGINT | ❌ | AUTO_INCREMENT |
| `nome` | VARCHAR(100) | ❌ | — |
| `email` | VARCHAR(255) | ❌ | UNIQUE |
| `ativo` | BOOLEAN | ✅ | TRUE |
| `criado_em` | TIMESTAMP | ✅ | CURRENT_TIMESTAMP |

---

## 📦 Installation

1. Open VS Code
2. Press `Ctrl+Shift+X`
3. Search for `SQL to Model`
4. Click **Install**

---

## Part of the Albertool ecosystem

- [Albertool Constructor](https://github.com/SidneiAJr/albertool-constructor) — constructor, getters, setters and interface generator
- [Albertool DocGen](https://github.com/SidneiAJr/albertool-docgen) — automatic documentation generator

---

## License

MIT

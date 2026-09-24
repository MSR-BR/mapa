import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const defaultProjectRoot = path.resolve(scriptDirectory, "..");
const tablePrivileges = ["select", "insert", "update", "delete", "truncate", "references", "trigger"];
const legacyDataApiRoles = ["anon", "authenticated", "service_role"];
const knownTypeStarters = new Set([
  "bigint", "boolean", "date", "double", "integer", "json", "jsonb", "numeric",
  "real", "smallint", "text", "time", "timestamp", "uuid", "varchar",
]);

const normalizeSql = (sql) => sql
  .replace(/--.*$/gm, " ")
  .replace(/\s+/g, " ")
  .trim()
  .toLowerCase();

const compactSql = (sql) => normalizeSql(sql).replace(/\s+/g, "");

function splitArguments(argumentsSql) {
  const argumentsList = [];
  let depth = 0;
  let current = "";
  for (const character of argumentsSql) {
    if (character === "(" || character === "[") depth += 1;
    if (character === ")" || character === "]") depth -= 1;
    if (character === "," && depth === 0) {
      argumentsList.push(current);
      current = "";
    } else current += character;
  }
  if (current.trim()) argumentsList.push(current);
  return argumentsList;
}

function canonicalArgumentType(argumentSql) {
  const withoutDefault = argumentSql
    .trim()
    .toLowerCase()
    .replace(/\s+(?:default\s+|=)[\s\S]*$/, "")
    .replace(/^(?:inout|in|out|variadic)\s+/, "");
  const tokens = withoutDefault.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return "";
  const first = tokens[0].replace(/\[\]$/, "");
  const typeTokens = knownTypeStarters.has(first) || first.includes(".")
    ? tokens
    : tokens.slice(1);
  return typeTokens.join(" ").replace(/\s+/g, "");
}

function canonicalFunctionSignature(name, argumentsSql) {
  const types = splitArguments(argumentsSql)
    .map(canonicalArgumentType)
    .filter(Boolean);
  return `${name.toLowerCase()}(${types.join(",")})`;
}

function extractFunctionDefinitions(sql) {
  const definitions = [];
  const expression = /\bcreate\s+(?:or\s+replace\s+)?function\s+((?:public|private)\.[a-z_][a-z0-9_]*)\s*\(([^)]*)\)/gi;
  for (const match of sql.matchAll(expression)) {
    const tail = sql.slice(match.index);
    const attributesEnd = tail.search(/\bas\s+\$\$/i);
    if (attributesEnd < 0) continue;
    definitions.push({
      attributes: normalizeSql(tail.slice(0, attributesEnd)),
      signature: canonicalFunctionSignature(match[1], match[2]),
    });
  }
  return definitions;
}

function applySetDifference(actual, expected, label, errors) {
  for (const value of actual) {
    if (!expected.has(value)) errors.push(`${label} não declarado no manifesto: ${value}`);
  }
  for (const value of expected) {
    if (!actual.has(value)) errors.push(`${label} declarado, mas não criado pelas migrations: ${value}`);
  }
}

function statementRoles(rolesSql) {
  return rolesSql
    .replace(/\s+with\s+grant\s+option[\s\S]*$/, "")
    .split(",")
    .map((role) => role.trim().replace(/^"|"$/g, ""))
    .filter(Boolean);
}

function statementPrivileges(privilegesSql, kind) {
  if (/\ball\b/.test(privilegesSql)) return ["all"];
  const allowed = kind === "function" ? ["execute"] : tablePrivileges;
  return allowed.filter((privilege) => new RegExp(`\\b${privilege}\\b`).test(privilegesSql));
}

function applyPrivilegeStatement(state, touched, action, privileges, roles, availablePrivileges) {
  for (const role of roles) {
    if (!state.has(role)) state.set(role, new Set());
    if (!touched.has(role)) touched.set(role, new Set());
    touched.get(role).add(action);
    const rolePrivileges = state.get(role);
    if (privileges.includes("all")) {
      if (action === "grant") for (const privilege of availablePrivileges) rolePrivileges.add(privilege);
      else rolePrivileges.clear();
      continue;
    }
    for (const privilege of privileges) {
      if (action === "grant") rolePrivileges.add(privilege);
      else rolePrivileges.delete(privilege);
    }
  }
}

function equalSets(left, right) {
  return left.size === right.size && [...left].every((value) => right.has(value));
}

export async function loadExplicitGrantAudit(projectRoot = defaultProjectRoot) {
  const migrationDirectory = path.join(projectRoot, "supabase", "migrations");
  const migrationNames = (await readdir(migrationDirectory))
    .filter((name) => name.endsWith(".sql"))
    .sort();
  const migrations = await Promise.all(migrationNames.map(async (name) => ({
    name,
    sql: await readFile(path.join(migrationDirectory, name), "utf8"),
  })));
  const manifest = JSON.parse(await readFile(
    path.join(projectRoot, "supabase", "explicit-access-manifest.json"),
    "utf8",
  ));
  return { manifest, migrations };
}

export function auditExplicitGrants({ manifest, migrations }) {
  const errors = [];
  const tables = new Set();
  const views = new Set();
  const sequences = new Set();
  const functions = new Set();
  const latestFunctionDefinition = new Map();
  const rlsState = new Map();
  const policyState = new Map();
  const normalizedMigrations = [];

  for (const migration of migrations) {
    const normalized = normalizeSql(migration.sql);
    normalizedMigrations.push({ name: migration.name, normalized });

    for (const match of normalized.matchAll(/\bcreate\s+table(?:\s+if\s+not\s+exists)?\s+((?:public|private)\.[a-z_][a-z0-9_]*)/g)) tables.add(match[1]);
    for (const match of normalized.matchAll(/\bdrop\s+table(?:\s+if\s+exists)?\s+((?:public|private)\.[a-z_][a-z0-9_]*)/g)) tables.delete(match[1]);
    for (const match of normalized.matchAll(/\bcreate\s+(?:or\s+replace\s+)?view\s+((?:public|private)\.[a-z_][a-z0-9_]*)/g)) views.add(match[1]);
    for (const match of normalized.matchAll(/\bdrop\s+view(?:\s+if\s+exists)?\s+((?:public|private)\.[a-z_][a-z0-9_]*)/g)) views.delete(match[1]);
    for (const match of normalized.matchAll(/\bcreate\s+sequence(?:\s+if\s+not\s+exists)?\s+((?:public|private)\.[a-z_][a-z0-9_]*)/g)) sequences.add(match[1]);
    for (const match of normalized.matchAll(/\bdrop\s+sequence(?:\s+if\s+exists)?\s+((?:public|private)\.[a-z_][a-z0-9_]*)/g)) sequences.delete(match[1]);
    if (/\b(?:smallserial|serial|bigserial)\b|\bgenerated\s+(?:always|by\s+default)\s+as\s+identity\b/.test(normalized)) {
      errors.push(`Sequence implícita sem decisão explícita em ${migration.name}`);
    }

    for (const definition of extractFunctionDefinitions(migration.sql)) {
      functions.add(definition.signature);
      latestFunctionDefinition.set(definition.signature, definition);
    }

    for (const match of normalized.matchAll(/\balter\s+table\s+((?:public|private)\.[a-z_][a-z0-9_]*)\s+(enable|disable)\s+row\s+level\s+security/g)) {
      rlsState.set(match[1], match[2] === "enable");
    }

    for (const statement of normalized.split(";")) {
      const createPolicy = statement.match(/\bcreate\s+policy\s+"?([a-z_][a-z0-9_]*)"?\s+on\s+((?:public|private)\.[a-z_][a-z0-9_]*)/);
      if (createPolicy) {
        if (!policyState.has(createPolicy[2])) policyState.set(createPolicy[2], new Set());
        policyState.get(createPolicy[2]).add(createPolicy[1]);
      }
      const dropPolicy = statement.match(/\bdrop\s+policy(?:\s+if\s+exists)?\s+"?([a-z_][a-z0-9_]*)"?\s+on\s+((?:public|private)\.[a-z_][a-z0-9_]*)/);
      if (dropPolicy) policyState.get(dropPolicy[2])?.delete(dropPolicy[1]);
    }
  }

  const expectedTables = new Set(manifest.tables.map((entry) => entry.name));
  const expectedViews = new Set(manifest.views.map((entry) => entry.name));
  const expectedSequences = new Set(manifest.sequences.map((entry) => entry.name));
  const expectedFunctions = new Set(manifest.functions.map((entry) => entry.signature));
  applySetDifference(tables, expectedTables, "Tabela", errors);
  applySetDifference(views, expectedViews, "View", errors);
  applySetDifference(sequences, expectedSequences, "Sequence", errors);
  applySetDifference(functions, expectedFunctions, "Função", errors);

  const combinedSql = normalizedMigrations.map(({ normalized }) => normalized).join("\n");
  const privilegeStatements = [...combinedSql.matchAll(/\b(grant|revoke)\s+([\s\S]*?)\s+on\s+(table|function|sequence)\s+([\s\S]*?)\s+(to|from)\s+([^;]+);/g)];
  const migrationNames = new Set(migrations.map(({ name }) => name));

  for (const table of manifest.tables) {
    if (!migrationNames.has(table.migration)) errors.push(`Migration de evidência ausente para ${table.name}: ${table.migration}`);
    if (table.rls && rlsState.get(table.name) !== true) errors.push(`RLS final não está habilitada em ${table.name}`);
    const actualPolicies = policyState.get(table.name) ?? new Set();
    const expectedPolicies = new Set(table.policies);
    if (!equalSets(actualPolicies, expectedPolicies)) {
      errors.push(`Policies finais divergentes em ${table.name}: esperado [${[...expectedPolicies].join(", ")}], obtido [${[...actualPolicies].join(", ")}]`);
    }

    const state = new Map([
      ["public", new Set()],
      ...legacyDataApiRoles.map((role) => [role, new Set(tablePrivileges)]),
    ]);
    const touched = new Map();
    for (const statement of privilegeStatements) {
      const [, action, privilegesSql, kind, objectsSql, , rolesSql] = statement;
      if (kind !== "table" || !compactSql(objectsSql).includes(table.name)) continue;
      const privileges = statementPrivileges(privilegesSql, kind);
      const roles = statementRoles(rolesSql);
      if (action === "grant") {
        for (const role of roles) {
          if (!(role in table.privileges)) errors.push(`Grant para papel não declarado em ${table.name}: ${role}`);
        }
      }
      if (action === "grant" && privileges.includes("all") && roles.some((role) => ["public", "anon", "authenticated"].includes(role))) {
        errors.push(`Grant amplo proibido em ${table.name}: ${roles.join(", ")}`);
      }
      applyPrivilegeStatement(state, touched, action, privileges, roles, tablePrivileges);
    }
    for (const [role, expectedList] of Object.entries(table.privileges)) {
      if (!touched.has(role)) errors.push(`Decisão de privilégio ausente para ${role} em ${table.name}`);
      const actual = state.get(role) ?? new Set();
      const expected = new Set(expectedList);
      if (!equalSets(actual, expected)) {
        errors.push(`Privilégios divergentes para ${role} em ${table.name}: esperado [${[...expected].join(", ")}], obtido [${[...actual].join(", ")}]`);
      }
    }
  }

  for (const functionEntry of manifest.functions) {
    if (!migrationNames.has(functionEntry.migration)) errors.push(`Migration de evidência ausente para ${functionEntry.signature}: ${functionEntry.migration}`);
    const definition = latestFunctionDefinition.get(functionEntry.signature);
    if (!definition) continue;
    const actualSecurity = definition.attributes.includes("security definer") ? "definer" : "invoker";
    if (actualSecurity !== functionEntry.security) {
      errors.push(`Modo de segurança divergente em ${functionEntry.signature}: ${actualSecurity}`);
    }
    const hasSearchPath = /\bset\s+search_path\s*=/.test(definition.attributes);
    const hasEmptySearchPath = /\bset\s+search_path\s*=\s*''/.test(definition.attributes);
    if (functionEntry.searchPath === "empty" && !hasEmptySearchPath) errors.push(`search_path vazio ausente em ${functionEntry.signature}`);
    if (functionEntry.searchPath === "fixed" && !hasSearchPath) errors.push(`search_path fixo ausente em ${functionEntry.signature}`);
    if (actualSecurity === "definer" && !hasEmptySearchPath) errors.push(`SECURITY DEFINER sem search_path vazio em ${functionEntry.signature}`);

    const state = new Map([
      ["public", new Set(["execute"])],
      ...legacyDataApiRoles.map((role) => [role, new Set(["execute"])]),
    ]);
    const touched = new Map();
    for (const statement of privilegeStatements) {
      const [, action, privilegesSql, kind, objectsSql, , rolesSql] = statement;
      if (kind !== "function" || !compactSql(objectsSql).includes(functionEntry.signature)) continue;
      const privileges = statementPrivileges(privilegesSql, kind);
      const roles = statementRoles(rolesSql);
      if (action === "grant") {
        for (const role of roles) {
          if (!(role in functionEntry.execute)) errors.push(`EXECUTE para papel não declarado em ${functionEntry.signature}: ${role}`);
        }
      }
      if (action === "grant" && privileges.includes("all") && roles.some((role) => ["public", "anon", "authenticated"].includes(role))) {
        errors.push(`Grant amplo proibido em ${functionEntry.signature}: ${roles.join(", ")}`);
      }
      applyPrivilegeStatement(state, touched, action, privileges, roles, ["execute"]);
    }
    for (const [role, expected] of Object.entries(functionEntry.execute)) {
      if (!touched.has(role) && role !== "public") errors.push(`Decisão de EXECUTE ausente para ${role} em ${functionEntry.signature}`);
      if (role === "public" && !touched.has("public")) errors.push(`Revogação de EXECUTE de PUBLIC ausente em ${functionEntry.signature}`);
      const effective = (state.get(role)?.has("execute") ?? false)
        || (role !== "public" && (state.get("public")?.has("execute") ?? false));
      if (effective !== expected) errors.push(`EXECUTE divergente para ${role} em ${functionEntry.signature}: ${effective}`);
    }
  }

  return {
    errors,
    summary: {
      functions: functions.size,
      migrations: migrations.length,
      sequences: sequences.size,
      tables: tables.size,
      views: views.size,
    },
  };
}

export async function auditExplicitGrantRepository(projectRoot = defaultProjectRoot) {
  return auditExplicitGrants(await loadExplicitGrantAudit(projectRoot));
}

const invokedDirectly = process.argv[1]
  && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (invokedDirectly) {
  const result = await auditExplicitGrantRepository();
  if (result.errors.length > 0) {
    console.error(JSON.stringify({ ...result, status: "fail" }, null, 2));
    process.exitCode = 1;
  } else {
    console.log(JSON.stringify({ ...result, status: "pass" }, null, 2));
  }
}

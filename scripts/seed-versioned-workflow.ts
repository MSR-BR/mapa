import { writeFileSync, mkdirSync } from "node:fs";
import { fixtureId, versionedWorkflowFixture } from "../tests/fixtures/versioned-workflow";
const workflow = versionedWorkflowFixture();
const quote = (value: unknown) => `'${JSON.stringify(value).replaceAll("'", "''")}'::jsonb`;
mkdirSync("tmp", { recursive: true });
let sql = `insert into auth.users(id,email) values ('${fixtureId(1)}','author@example.invalid'),('${fixtureId(3)}','student@example.invalid'),('${fixtureId(4)}','other@example.invalid');
insert into public.user_profiles(user_id,active_role) values ('${fixtureId(1)}','advisor'),('${fixtureId(3)}','student'),('${fixtureId(4)}','advisor');
insert into public.projects(id,owner_id,title,workflow_version,authoring_role,advisor_id,advisor_email) values ('${fixtureId(2)}','${fixtureId(1)}','Fixture C111',2,'advisor',null,null),('${fixtureId(5)}','${fixtureId(3)}','Fixture student C111',2,'student','${fixtureId(1)}','author@example.invalid');\n`;
for (const [project, owner, legacyCount] of [[2,1,1000],[5,3,0]]) {
  const content = structuredClone(workflow.content);
  content.elementVersions = Array.from({ length: legacyCount }, (_, i) => ({ ...content.elements[0], revision: i + 1, archivedAt: workflow.updatedAt, elementId: content.elements[0].id }));
  delete content.historyVersion;
  sql += `insert into public.research_workflows(project_id,owner_id,state,stable_state,revision,source_revision,content) values ('${fixtureId(project)}','${fixtureId(owner)}','completed','completed',10,5,${quote(content)});\n`;
}
writeFileSync("tmp/c111-history-seed.sql", sql);

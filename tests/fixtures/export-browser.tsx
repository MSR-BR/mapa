import { createRoot } from "react-dom/client";
import { useState } from "react";
import { FinalMapWorkspace } from "../../modules/research-workflow/final-map-workspace";
import { ResearchPromptInput } from "../../modules/projects/research-prompt-input";
import { RESEARCH_INTAKE_FIELDS } from "../../modules/projects/research-intake";
import { versionedWorkflowFixture } from "./versioned-workflow";
import { withAdvisorReviewRequest } from "../../modules/research-workflow/advisor-review";
const mode = new URLSearchParams(location.search).get("mode");
const workflow = versionedWorkflowFixture();
workflow.navigation = undefined;
workflow.content.initialBriefing = { researchType: "dissertacao", ...Object.fromEntries(RESEARCH_INTAKE_FIELDS.map(({ name }) => [name, `Original sintético preservado: ${name}.`])) } as NonNullable<typeof workflow.content.initialBriefing>;
if (mode === "pending") {
  workflow.state = workflow.stableState = "reviewing_map";
  workflow.content = withAdvisorReviewRequest(workflow.content, { advisorEmail: "advisor@example.invalid", studentEmail: "student@example.invalid", sourceRevision: workflow.sourceRevision, step: "final_map", transition: { targetActiveStep: null, targetStableState: "completed", targetState: "completed" } });
}
Object.assign(window, { fixtureWorkflow: workflow });
function Prompt() {
  const [value, setValue] = useState("");
  return <ResearchPromptInput id="prompt" aiSuggestionsEnabled={mode === "authenticated"} onChange={setValue} onEnter={() => {}} value={value} />;
}
createRoot(document.getElementById("root")!).render(mode === "anonymous" || mode === "authenticated" ? <Prompt /> : <FinalMapWorkspace initialWorkflow={workflow} isSelfDirectedProject={mode !== "pending"} projectId={workflow.projectId} />);

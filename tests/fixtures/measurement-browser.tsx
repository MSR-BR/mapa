import { createRoot } from "react-dom/client";
import { AnalyticsConsent } from "../../modules/analytics/analytics-consent";
import { GenerationWorkspace } from "../../modules/generation/generation-workspace";
import { LiteratureDevelopmentWorkspace } from "../../modules/research-workflow/literature-development-workspace";
import { ExportPdfLink } from "../../modules/analytics/export-pdf-link";
import { SocialAuthForm, SocialAuthErrorNotice } from "../../modules/auth/social-auth-form";
import { DashboardProjectGrid } from "../../modules/projects/dashboard-project-grid";
import { ProposalDiscoveryWorkspace } from "../../modules/research-workflow/proposal-discovery-workspace";
import { ResearchPromptInput } from "../../modules/projects/research-prompt-input";
import { versionedWorkflowFixture } from "./versioned-workflow";

const params = new URLSearchParams(location.search);
const flow = params.get("flow");
const workflow = versionedWorkflowFixture();
workflow.content.activeStep = "literature_topics";
workflow.navigation = undefined;
const projects = [1, 2].map(n => ({ projectId: `synthetic-${n}`, title: `Sintético ${n}`, status: "completed" }));
let content;
switch (flow) {
  case "generation": content = <GenerationWorkspace initialSnapshot={{ structure: null, job: null, references: [] } as never} projectId="synthetic" />; break;
  case "literature": content = <LiteratureDevelopmentWorkspace initialWorkflow={workflow} isSelfDirectedProject projectId="synthetic" />; break;
  case "export": content = <ExportPdfLink href="/api/export" referenceCount={0} onFailure={() => {}}>Baixar PDF</ExportPdfLink>; break;
  case "integration": content = <DashboardProjectGrid projects={projects as never} variant="completed" title="Sintéticos" allowIntegration />; break;
  case "discovery": workflow.content.discovery = null; content = <ProposalDiscoveryWorkspace initialWorkflow={workflow} projectId="synthetic" originalPrompt="Tema sintético" autoDiscover />; break;
  case "login": content = <SocialAuthForm action={async () => {}} destination="/dashboard" label="Google" mark="G" provider="google" source="google" />; break;
  case "login-error": content = <SocialAuthErrorNotice code={params.get("code") === "access" ? "access" : "google"} message="Erro sintético" />; break;
  case "prompt": content = <ResearchPromptInput id="prompt" onChange={() => {}} onEnter={() => {}} value="" />; break;
  default: content = <><button id="outside" onClick={() => window.dispatchEvent(new Event("mapa:open-privacy-preferences"))}>Reabrir preferências</button><AnalyticsConsent measurementId="G-TEST" nonce="synthetic" /></>;
}
createRoot(document.getElementById("root")!).render(content);

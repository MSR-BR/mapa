import type { ComponentProps } from "react";

export function WorkflowAction({ help, ...props }: ComponentProps<"button"> & { help: string }) {
  return <span className="workflow-action"><button {...props} /><details className="workflow-action-help"><summary aria-label={`Informações: ${typeof props.children === "string" ? props.children : "ação"}`}>i</summary><p>{help}</p></details></span>;
}

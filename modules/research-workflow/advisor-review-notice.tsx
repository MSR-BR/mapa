import { ADVISOR_REVIEW_LABELS, currentAdvisorReview } from "./advisor-review";
import type { ResearchWorkflow } from "./schema";

export function AdvisorReviewNotice({ workflow }: { workflow: ResearchWorkflow }) {
  const review = currentAdvisorReview(workflow.content);
  if (!review) return null;
  const label = ADVISOR_REVIEW_LABELS[review.step];
  const title = review.status === "pending"
    ? "Aguardando validação do orientador"
    : "Correção solicitada pelo orientador";
  const body = review.status === "pending"
    ? `O estudante validou ${label}. A próxima etapa será liberada quando o orientador aprovar.`
    : `Revise ${label} conforme o comentário do orientador e valide novamente pelo estudante.`;

  return (
    <aside className={`advisor-review-notice advisor-review-notice-${review.status}`} role="status">
      <div>
        <strong>{title}</strong>
        <span>{body}</span>
      </div>
      {review.advisorComments ? <p>{review.advisorComments}</p> : null}
    </aside>
  );
}

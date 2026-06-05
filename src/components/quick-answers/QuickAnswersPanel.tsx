"use client";

import { HelpCircle } from "lucide-react";
import type { QuickAnswersViewModel } from "../../../lib/selectors/selectQuickAnswers";

type QuickAnswersPanelProps = {
  viewModel: QuickAnswersViewModel;
};

export function QuickAnswersPanel({ viewModel }: QuickAnswersPanelProps) {
  return (
    <section className="quick-answers-panel" aria-label="Quick answers">
      <div className="quick-answers-head">
        <span><HelpCircle size={16} aria-hidden /> {viewModel.title}</span>
        <em>{viewModel.context}</em>
      </div>
      <div className="quick-answers-grid">
        {viewModel.answers.map((item) => (
          <details className="quick-answer-card" key={item.question}>
            <summary>
              <strong>{item.question}</strong>
              <span>{item.answer}</span>
            </summary>
            <p>{item.detail}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

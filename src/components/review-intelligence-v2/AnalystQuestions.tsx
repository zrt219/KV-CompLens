import { HelpCircle } from "lucide-react"

export function AnalystQuestions({ questions }: { questions: string[] }) {
  return (
    <section className="ri-card">
      <div className="ri-card-head">
        <div>
          <span className="ri-kicker">Analyst Questions</span>
          <h3>Open review items</h3>
        </div>
      </div>
      <ul className="ri-question-list">
        {questions.map((question) => (
          <li key={question}>
            <HelpCircle size={15} aria-hidden />
            <span>{question}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

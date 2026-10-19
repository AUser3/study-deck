import { InfoPageLayout } from "@/features/site/info-page-layout";

const questions = [
  {
    question: "Where is my data stored?",
    answer:
      "Studydeck uses the application-data directory of the operating system running the app. Open the Data menu in the header and choose Open data folder to see the exact location.",
  },
  {
    question: "Does Studydeck upload my courses?",
    answer:
      "No. The current app has no database or cloud sync. Its browser talks only to the local Studydeck server that you started on your computer.",
  },
  {
    question: "How do I move my data to another computer?",
    answer:
      "Choose Download backup from the Data menu, move the JSON backup file, then choose Restore backup on the other installation. Managed old-exam PDFs are included in that backup.",
  },
  {
    question: "Can a question have several correct answers?",
    answer:
      "Yes. Choice questions support up to 16 answer choices and can mark one or several of them as correct. A question with no choices is used in typed-answer mode.",
  },
  {
    question: "Can I write Markdown in notes?",
    answer:
      "You can write and preserve Markdown syntax as plain text. Studydeck does not render Markdown formatting yet.",
  },
  {
    question: "What happens when I delete a course?",
    answer:
      "Its topics, questions, progress, notes, old-exam metadata, and managed PDFs are removed with it. Download a backup first if you may need them later.",
  },
];

export function FaqPage() {
  return (
    <InfoPageLayout
      eyebrow="Help"
      title="Frequently asked questions"
      intro="Short answers about local storage, backups, questions, and course material."
    >
      <section className="space-y-3">
        {questions.map(({ question, answer }) => (
          <details key={question} className="group rounded-xl border bg-card p-5 shadow-card">
            <summary className="cursor-pointer list-none pr-8 font-semibold marker:hidden">
              {question}
              <span
                className="float-right text-primary transition-transform group-open:rotate-45"
                aria-hidden
              >
                +
              </span>
            </summary>
            <p className="text-sm">{answer}</p>
          </details>
        ))}
      </section>
    </InfoPageLayout>
  );
}

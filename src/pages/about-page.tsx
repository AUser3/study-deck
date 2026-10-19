import { Database, FileQuestion, GraduationCap, ShieldCheck } from "lucide-react";

import { InfoPageLayout } from "@/features/site/info-page-layout";

const principles = [
  {
    icon: GraduationCap,
    title: "Built around courses",
    text: "Group questions, notes, and old exams by the course you are actually studying.",
  },
  {
    icon: Database,
    title: "Local-first data",
    text: "Your study material is stored on the computer running Studydeck, without a database account.",
  },
  {
    icon: ShieldCheck,
    title: "Private by default",
    text: "Personal course data stays outside the Git repository and is never included in source control.",
  },
  {
    icon: FileQuestion,
    title: "Flexible practice",
    text: "Use typed answers or multiple choice questions with one or several correct answers.",
  },
];

export function AboutPage() {
  return (
    <InfoPageLayout
      eyebrow="About Studydeck"
      title="One place for the work behind studying"
      intro="Studydeck is an open-source, local-first study hub for building question banks, keeping course notes, and organizing old exams."
    >
      <section>
        <h2>Why it exists</h2>
        <p>
          Study material often ends up scattered between documents, downloads, and flashcard tools.
          Studydeck brings the useful parts together without requiring an online account or remote
          database.
        </p>
      </section>
      <section className="grid gap-4 sm:grid-cols-2">
        {principles.map(({ icon: Icon, title, text }) => (
          <div key={title} className="rounded-xl border bg-card p-5 shadow-card">
            <Icon className="h-5 w-5 text-primary" aria-hidden />
            <h2 className="mt-3 text-lg!">{title}</h2>
            <p className="text-sm">{text}</p>
          </div>
        ))}
      </section>
      <section>
        <h2>What local-first means here</h2>
        <p>
          The app runs in your browser, while its local server saves validated JSON and managed PDFs
          in your operating system's application-data directory. Use the Data menu to open that
          folder or download a portable backup.
        </p>
      </section>
    </InfoPageLayout>
  );
}

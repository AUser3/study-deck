/** Demo content. Flagged with `demo: true`; app logic never depends on it. */
import type { AppState, Attempt, Course, Question, Topic } from "./types";

type QDef = [
  text: string,
  choices: string[],
  correct: number | number[] | string,
  explanation?: string,
];

const DEMO: { course: string; description: string; topics: { name: string; qs: QDef[] }[] }[] = [
  {
    course: "Computer Networks",
    description: "Protocols, routing and the layers that hold the internet together.",
    topics: [
      {
        name: "Routing",
        qs: [
          [
            "Which protocol uses Dijkstra's algorithm?",
            ["BGP", "OSPF", "RIP", "STP"],
            1,
            "OSPF computes shortest paths with SPF (Dijkstra).",
          ],
          [
            "What is the maximum reachable hop count in RIP?",
            ["15", "16"],
            0,
            "16 hops means unreachable in RIP.",
          ],
          [
            "Which protocol routes between autonomous systems on the internet?",
            ["OSPF", "EIGRP", "BGP"],
            2,
          ],
          [
            "What is the administrative distance of a directly connected route?",
            [],
            "0",
            "Connected routes are the most trusted.",
          ],
          ["A routing table entry of 0.0.0.0/0 is called what?", [], "Default route"],
        ],
      },
      {
        name: "DNS",
        qs: [
          [
            "What does DNS stand for?",
            [],
            "Domain Name System",
            "DNS resolves names to records such as IP addresses.",
          ],
          [
            "Which record type maps a name to an IPv6 address?",
            ["A", "AAAA", "MX", "CNAME", "PTR", "TXT"],
            1,
          ],
          ["Which port does DNS primarily use?", ["53", "80", "443", "25"], 0],
        ],
      },
      {
        name: "Transport layer",
        qs: [
          ["Which protocol provides reliable, ordered delivery?", ["UDP", "TCP"], 1],
          ["How many steps are in the TCP connection handshake?", [], "3", "SYN, SYN-ACK, ACK."],
          ["Which flag closes a TCP connection gracefully?", ["RST", "FIN", "PSH", "URG"], 1],
        ],
      },
    ],
  },
  {
    course: "Spanish Vocabulary",
    description: "Everyday words and phrases for A2 level.",
    topics: [
      {
        name: "Food & drink",
        qs: [
          ["“Apple” in Spanish", [], "manzana"],
          ["“Water” in Spanish", ["leche", "agua", "vino"], 1],
          [
            "“La cuenta, por favor” means…",
            ["The menu, please", "The bill, please", "A table, please", "The bathroom, please"],
            1,
          ],
          ["“Bread” in Spanish", [], "pan"],
        ],
      },
      {
        name: "Travel",
        qs: [
          ["“Train station” in Spanish", [], "estación de tren"],
          ["“¿Dónde está…?” means", ["Where is…?", "What is…?", "When is…?"], 0],
          [
            "“Ticket” (for transport) in Spanish",
            ["billete", "boleto de cine", "carta"],
            0,
            "In Latin America “boleto” is also common.",
          ],
        ],
      },
    ],
  },
];

export function buildDemoState(now = Date.now()): AppState {
  const courses: Course[] = [];
  const topics: Topic[] = [];
  const questions: Question[] = [];
  const attempts: Attempt[] = [];
  let n = 0;
  const id = (p: string) => `demo-${p}-${++n}`;
  const DAY = 86_400_000;

  DEMO.forEach((c, ci) => {
    const course: Course = {
      id: id("course"),
      name: c.course,
      description: c.description,
      demo: true,
      createdAt: now - (10 - ci) * DAY,
    };
    courses.push(course);
    c.topics.forEach((t, ti) => {
      const topic: Topic = {
        id: id("topic"),
        courseId: course.id,
        name: t.name,
        demo: true,
        createdAt: course.createdAt + ti,
      };
      topics.push(topic);
      t.qs.forEach(([text, choices, correct, explanation], qi) => {
        const correctIndices = choices.length
          ? Array.isArray(correct)
            ? correct
            : [correct as number]
          : [];
        const q: Question = {
          id: id("q"),
          courseId: course.id,
          topicId: topic.id,
          text,
          choices,
          correctIndices,
          answer: choices.length
            ? correctIndices.map((index) => choices[index]).join("; ")
            : (correct as string),
          explanation,
          demo: true,
          createdAt: topic.createdAt + qi,
        };
        questions.push(q);
        // Deterministic demo history: first course well-studied, second lightly.
        const count = ci === 0 ? (qi + ti) % 4 : qi % 2;
        for (let k = 0; k < count; k++) {
          attempts.push({
            id: id("a"),
            questionId: q.id,
            mode: choices.length ? "mc" : "typed",
            correct: (qi + k + ti) % 3 !== 0,
            at: now - (count - 1 - k) * DAY - (qi + 1) * 60_000,
          });
        }
      });
    });
  });
  return { version: 2, courses, topics, questions, attempts };
}

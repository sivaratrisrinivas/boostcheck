const LABEL: Record<string, string> = { OK_TO_BOOST: "OK to boost", NEEDS_EDIT: "Needs edit", ADD_AI_LABEL: "Add AI label", NEEDS_HUMAN: "Needs a person" };
export function Chip({ d }: { d: string | null }) {
  if (!d) return <span className="chip">Not checked</span>;
  return <span className={`chip ${d}`}>{LABEL[d] ?? d}</span>;
}

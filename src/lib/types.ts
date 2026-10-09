export type Decision = "OK_TO_BOOST" | "NEEDS_EDIT" | "ADD_AI_LABEL" | "NEEDS_HUMAN";

export type FlagType =
  | "absolute_claim"
  | "implied_result"
  | "before_after"
  | "promo_mismatch"
  | "promo_no_terms"
  | "missing_disclosure"
  | "unlabeled_ai"
  | "non_english";

export type Source = "caption" | "transcript" | "onscreen" | "landing" | "metadata";

/** AI use as declared by the creator or the brand in post metadata. Pixels are not inspected. */
export type AiUse =
  | "ai_voice_clone"
  | "ai_generated_person"
  | "ai_generated_video"
  | "ai_face_swap"
  | "background_removal"
  | "color_correction"
  | "denoise";

export interface PostInput {
  caption: string;
  transcript: string;
  onscreen?: string;
  landing: string;
  meta: {
    aiUse: AiUse[];
    aiLabel: boolean;
    disclosureToggle: boolean;
  };
}

export interface Flag {
  type: FlagType;
  source: Source;
  quote: string; // verbatim span from the source
  sectionId: string; // key into POLICY
  reason: string;
  by: "rules" | "model";
}

export interface CheckResult {
  decision: Decision;
  flags: Flag[];
  creatorNote: string | null;
  notes: string[]; // reviewer-facing notes (e.g. dropped model flags, joke judgement)
  model: string | null;
  ms: number;
}

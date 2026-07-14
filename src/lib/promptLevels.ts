import { VerbalPromptIcon } from "@/components/icons/VerbalPromptIcon";
import { GesturalPromptIcon } from "@/components/icons/GesturalPromptIcon";
import { ModelingPromptIcon } from "@/components/icons/ModelingPromptIcon";
import { PartialPhysicalPromptIcon } from "@/components/icons/PartialPhysicalPromptIcon";
import { FullPhysicalPromptIcon } from "@/components/icons/FullPhysicalPromptIcon";

/** Sits at the top of every prompt-level popup as a "yes, prompted/an error,
 *  but no particular level" choice — picking it marks the trial/step without
 *  ever populating a level, so the trigger button shows no sub-text. Shared
 *  by TrialCard's Error picker and TaskAnalysisCard's Prompted picker. */
export const UNSPECIFIED_LEVEL = "-unspecified-";

/** Only covers the prompt-hierarchy levels this app actually ships with — an
 *  unrecognized custom level just renders with no icon rather than needing
 *  this map kept exhaustively in sync. */
export const PROMPT_LEVEL_ICONS: Record<string, typeof VerbalPromptIcon> = {
  Verbal: VerbalPromptIcon,
  Gestural: GesturalPromptIcon,
  Modeling: ModelingPromptIcon,
  "Partial Physical": PartialPhysicalPromptIcon,
  "Full Physical": FullPhysicalPromptIcon,
};

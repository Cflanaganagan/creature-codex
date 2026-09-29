/**
 * Category badge images for all core categories.
 * Each maps to the most iconic user-provided badge for that group.
 */
import amphibiansImg from "@/assets/amphibian-badge.png";
import mammalsImg from "@/assets/smilodon-badge.png";
import reptilesImg from "@/assets/trex-badge.png";
import birdsImg from "@/assets/dodo-badge.png";
import aquaticImg from "@assets/aquatic_1777771643969.png";
import invertebratesImg from "@assets/invertebrates_1777771621097.png";
import mysteryImg from "@assets/mysterycreatures_1777749545365.png";

export const categoryBadges: Partial<Record<string, string>> = {
  "Mammals": mammalsImg,
  "Reptiles": reptilesImg,
  "Birds": birdsImg,
  "Aquatic": aquaticImg,
  "Amphibians": amphibiansImg,
  "Invertebrates": invertebratesImg,
  "Mystery Creatures": mysteryImg,
};

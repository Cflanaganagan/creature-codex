/**
 * Category badge images for all core categories.
 * Each maps to the most iconic user-provided badge for that group.
 */
import amphibiansImg from "@/assets/amphibian-badge.png";
import extinctBadges from "@/assets/extinct-exhibit-badges.png";
import aquaticImg from "@/assets/shark-badge.png";
import invertebratesImg from "@assets/invertebrates_1777771621097.png";
import mysteryImg from "@assets/mysterycreatures_1777749545365.png";

export const categoryBadges: Partial<Record<string, string>> = {
  "Mammals": extinctBadges,
  "Reptiles": extinctBadges,
  "Birds": extinctBadges,
  "Aquatic": aquaticImg,
  "Amphibians": amphibiansImg,
  "Invertebrates": invertebratesImg,
  "Mystery Creatures": mysteryImg,
};

// Display the original transparent artwork as three square windows without altering it.
export const categoryBadgePanels: Partial<Record<string, 0 | 1 | 2>> = {
  Mammals: 0, Birds: 1, Reptiles: 2,
};

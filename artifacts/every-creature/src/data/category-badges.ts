/**
 * Category badge images for all core categories.
 * Each maps to the most iconic user-provided badge for that group.
 */
import dinosaursImg from "@/assets/triceratops-badge.png";
import amphibiansImg from "@/assets/amphibian-badge.png";
import extinctBadges from "@/assets/extinct-exhibit-badges.png";
import synapsidsImg from "@/assets/dimetrodon-badge.png";
import reptilesImg from "@/assets/deinosuchus-badge.png";
import aquaticImg from "@/assets/shark-badge.png";
import invertebratesImg from "@assets/invertebrates_1777771621097.png";
import mysteryImg from "@assets/mysterycreatures_1777749545365.png";

export const categoryBadges: Partial<Record<string, string>> = {
  "Mammals": extinctBadges,
  "Dinosaurs": dinosaursImg,
  "Reptiles": reptilesImg,
  "Synapsids": synapsidsImg,
  "Birds": extinctBadges,
  "Fish": aquaticImg,
  "Amphibians & Early Tetrapods": amphibiansImg,
  "Invertebrates": invertebratesImg,
  "Mystery Creatures": mysteryImg,
};

// Display the original transparent artwork as three square windows without altering it.
export const categoryBadgePanels: Partial<Record<string, 0 | 1 | 2>> = {
  Mammals: 0, Birds: 1,
};

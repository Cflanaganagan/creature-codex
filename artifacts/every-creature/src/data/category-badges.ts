/**
 * Category badge images for all core categories.
 * Each maps to the most iconic user-provided badge for that group.
 */
import amphibiansImg from "@/assets/amphibian-badge.png";
import mammalsImg from "@assets/livinganimals_1777749622343.png";
import reptilesImg from "@assets/Screenshot_2026-05-02_3.51.45_PM_1777748467399.png";
import birdsImg from "@assets/birds_1777771681818.png";
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

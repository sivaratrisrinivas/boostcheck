// Synthetic brands. Fictional names, written for this prototype. Not real companies or SideShift customers.
export interface Brand {
  id: string;
  name: string;
  category: string;
  campaign: string;
  landing: string; // landing-page text the ad would point to
}

export const BRANDS: Record<string, Brand> = {
  dewly: {
    id: "dewly",
    name: "Dewly",
    category: "Skincare",
    campaign: "Dewly Barrier Serum: fall UGC",
    landing:
      "Dewly Barrier Serum. A lightweight serum with ceramides and niacinamide for everyday hydration. Fall sale: up to 30% off sitewide with code DEW30, ends Oct 31. Excludes gift sets. Results vary by skin type. Free shipping over $35.",
  },
  pocketly: {
    id: "pocketly",
    name: "Pocketly",
    category: "Personal finance app",
    campaign: "Pocketly budgeting buckets",
    landing:
      "Pocketly. Budget buckets, bill reminders and round-up savings in one app. Cash advance up to $250 for eligible members, no interest. Standard transfers arrive in 1 to 3 business days; instant transfer fee $3.99. Eligibility and limits apply. Fee schedule: monthly plan $4.99. Pocketly is not a bank.",
  },
  loopstep: {
    id: "loopstep",
    name: "Loopstep",
    category: "Fitness and habit app",
    campaign: "Loopstep walking streaks",
    landing:
      "Loopstep. Walking streaks, gentle reminders and weekly goals. Start a 7-day free trial, then $59.99 per year. This week only: 40% off the annual plan for new members, terms apply. Cancel anytime in settings.",
  },
};

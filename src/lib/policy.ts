// Quoted from TikTok's public ad policy pages (opened Oct 10, 2026).
// Misleading and false content (Last updated: April 2026):
//   https://ads.tiktok.com/help/article/tiktok-ads-policy-misleading-and-false-content
// Branded Content Policy (published 4 Aug 2026):
//   https://www.tiktok.com/legal/page/global/bc-policy/en
export const MISLEADING_URL =
  "https://ads.tiktok.com/help/article/tiktok-ads-policy-misleading-and-false-content";
export const BC_URL = "https://www.tiktok.com/legal/page/global/bc-policy/en";

export interface PolicySection {
  id: string;
  title: string;
  quote: string;
  url: string;
}

export const POLICY: Record<string, PolicySection> = {
  misleading_claims: {
    id: "misleading_claims",
    title: "Misleading and false content > Misleading claims",
    quote:
      "Ad content and landing pages must not promise or exaggerate results concerning a product's effect. ... do not allow ad content to feature absolute terms about a product in relation to time, region, or brand.",
    url: MISLEADING_URL,
  },
  inconsistent_info: {
    id: "inconsistent_info",
    title: "Misleading and false content > Inconsistent information",
    quote:
      "Ad content and landing pages that contain mismatched or inconsistent information on the promotion, price, discounts, or any such details, including the absence of information, missing disclaimers, or terms and conditions are not allowed.",
    url: MISLEADING_URL,
  },
  before_after: {
    id: "before_after",
    title: "Misleading and false content > Malicious, Subjective and Before-and-after Comparisons",
    quote:
      "We do not allow ad content and landing pages to include: Product effect comparisons, such as before-and-after results, which may cause viewers to have a false or distorted impression about a product's outcome/results",
    url: MISLEADING_URL,
  },
  aigc: {
    id: "aigc",
    title: "Misleading and false content > Edited media and AI-generated content (AIGC)",
    quote:
      "Significantly edited media and AIGC content is allowed if the following requirements are met: Apply the AIGC label, or by adding a clear disclaimer, caption, watermark, or sticker of your own. ... If we identify AI-generated content that has not been disclosed, your ad will be rejected or restricted.",
    url: MISLEADING_URL,
  },
  branded_disclosure: {
    id: "branded_disclosure",
    title: "Branded Content Policy > What do you need to do when you post Branded Content?",
    quote: "When posting Branded Content, you must enable the commercial content disclosure toggle.",
    url: BC_URL,
  },
};

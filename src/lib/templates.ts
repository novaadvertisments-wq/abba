import { GroupDraft } from "@/lib/groups";

// Starting points for a group campaign. Nothing is posted until the business taps Post.
export const GROUP_TEMPLATES: { id: string; label: string; draft: GroupDraft }[] = [
  { id: "event", label: "Event promo", draft: { title: "Come to our event", description: "Tell your followers about the event: the date, the place and how to get in.", target_lumens: 20, join_days: 7, duration_days: 3 } },
  { id: "product", label: "New product", draft: { title: "Meet our new product", description: "Show the product, say what it does and where to buy it.", target_lumens: 20, join_days: 7, duration_days: 7 } },
  { id: "sale", label: "Sale or discount", draft: { title: "Sale on now", description: "Share the discount and the last day to get it.", target_lumens: 10, join_days: 3, duration_days: 3 } },
  { id: "opening", label: "Grand opening", draft: { title: "We are opening soon", description: "Share the opening date and place, and invite people to come.", target_lumens: 50, join_days: 14, duration_days: 7 } },
  { id: "giveaway", label: "Giveaway", draft: { title: "Win a prize", description: "Explain how to enter the giveaway and when it ends.", target_lumens: 20, join_days: 7, duration_days: 7 } },
];

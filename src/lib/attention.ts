// Counts the things waiting for the person, to show as a small badge on a tab:
//  - a Nova: new offers they have not answered, and counter-offers from businesses
//  - a business: Nova answers that are waiting for its reply
// It looks again every 30 seconds and whenever the app comes back to the front.
import { useCallback, useEffect, useState } from "react";
import { AppState } from "react-native";

import { loadNovaGroups } from "./groups";
import { loadFeed, loadResponses } from "./negotiation";

const listeners = new Set<() => void>();

// Screens call this after they load, so the badge updates straight away.
export function pingBadges() {
  listeners.forEach((l) => l());
}

export function useAttentionCount(role: "nova" | "business", enabled: boolean): number {
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    if (role === "nova") {
      const [r, g] = await Promise.all([loadFeed(), loadNovaGroups()]);
      if (r.ok) {
        const offers = r.offers.filter(
          (o) => o.offer_status === "open" && (o.neg_status === null || o.neg_status === "pending_nova"),
        ).length;
        const groups = g.ok ? g.groups.filter((x) => x.status === "open" && !x.joined).length : 0;
        setCount(offers + groups);
      }
    } else {
      const r = await loadResponses();
      if (r.ok) {
        setCount(r.responses.filter((x) => x.status === "pending_business" && x.offer_status === "open").length);
      }
    }
  }, [role]);

  useEffect(() => {
    if (!enabled) {
      setCount(0);
      return;
    }
    refresh();
    const timer = setInterval(refresh, 30000);
    listeners.add(refresh);
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh();
    });
    return () => {
      clearInterval(timer);
      listeners.delete(refresh);
      sub.remove();
    };
  }, [enabled, refresh]);

  return count;
}

// Day 14f: the "i" guide for each screenshot. Short words plus an example picture of the app screen to capture.
// The pictures show WHERE to go and WHAT to include (poster, time, views), not what the post looks like.
// Services without a picture yet show the words only. Add a picture here when it arrives.
import { ImageSourcePropType } from "react-native";

import { ShotKind } from "./verification";

const POSTER_AND_OWN: Record<string, ImageSourcePropType | undefined> = {
  snapchat: require("../../assets/images/examples/snapchat-poster-views.jpg"),
  whatsapp: require("../../assets/images/examples/whatsapp-poster-views.jpg"),
  instagram: require("../../assets/images/examples/instagram-poster-views.jpg"),
  // facebook: later. TikTok and X poster-views pictures: if they come
};

const PROFILE: Record<string, ImageSourcePropType | undefined> = {
  tiktok: require("../../assets/images/examples/tiktok-profile.jpg"),
  x: require("../../assets/images/examples/x-profile.jpg"),
};

// The service id may be like "instagram_post"; the screens belong to the app.
function baseOf(service: string): string {
  return service.split("_")[0];
}

export function exampleImage(service: string, kind: ShotKind): ImageSourcePropType | undefined {
  const base = baseOf(service);
  if (kind === "profile") return PROFILE[base];
  return POSTER_AND_OWN[base];
}

// A few short lines, written for the app the Nova is using.
export function guideLines(service: string, kind: ShotKind, appName: string): string[] {
  const base = baseOf(service);
  if (kind === "profile") {
    return [
      `Open your ${appName} profile page.`,
      "Make sure your name, your followers and the views on your recent posts are all on the screen.",
      base === "x" ? "Show at least 3 recent posts." : "Show at least 6 recent posts.",
      "Take a screenshot. Do not edit it.",
    ];
  }
  const where: Record<string, string> = {
    snapchat: "Open My Story and tap the story. The time posted shows at the top and the views (the eye) at the bottom.",
    whatsapp: "Open My status and swipe up on it. The time shows at the top and Viewed by at the bottom.",
    instagram: "Open the story and tap the viewers at the bottom left. The number of viewers shows with the picture.",
    facebook: "Open the story and swipe up. The viewers show at the bottom.",
    tiktok: "Open the post and look at the views under it.",
    x: "Open the post and look at the views under it.",
  };
  const what = kind === "poster_views" ? "the ABBA poster" : "one of your own posts";
  return [
    where[base] ?? "Open the views screen for it.",
    `The screenshot must show ${what}, when it was posted and the number of views.`,
    "Take a screenshot. Do not edit it.",
  ];
}

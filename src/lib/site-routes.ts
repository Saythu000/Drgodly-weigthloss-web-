import { blogPosts } from "@/lib/blogs";
import { eventItems } from "@/lib/events";

export const staticRoutes = [
  "/",
  "/blogs",
  "/events",
  "/bmi-calculator",
  "/intake",
  "/results",
  "/checkout",
  "/appointment",
  "/dashboard",
];

export const siteRoutes = [
  ...staticRoutes,
  ...blogPosts.map((post) => `/blogs/${post.slug}`),
  ...eventItems.map((event) => `/events/${event.slug}`),
];

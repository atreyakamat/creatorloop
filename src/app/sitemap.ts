import type { MetadataRoute } from "next";
import { landingOnly, siteUrl } from "@/lib/env";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const paths = landingOnly() ? ["", "/terms", "/privacy"] : ["", "/signup", "/login", "/terms", "/privacy"];
  return paths.map((path) => ({
    url: `${base}${path}`,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.5,
  }));
}

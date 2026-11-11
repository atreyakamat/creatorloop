import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/business", "/creator", "/admin", "/dashboard", "/auth", "/reset-password"] }],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}

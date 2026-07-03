import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { getServiceCityPairs, getAllOfficeSlugs } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE.url;
  const entries: MetadataRoute.Sitemap = [{ url: `${base}/`, priority: 1 }];

  const [pairs, offices] = await Promise.all([
    getServiceCityPairs(),
    getAllOfficeSlugs(),
  ]);
  for (const { service, city } of pairs) {
    entries.push({ url: `${base}/${service}/${city}`, priority: 0.9 });
  }
  for (const office of offices) {
    entries.push({ url: `${base}/office/${office}`, priority: 0.8 });
  }

  return entries;
}

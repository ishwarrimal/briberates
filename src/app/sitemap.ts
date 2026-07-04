import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import {
  getServiceCityPairs,
  getAllOfficeSlugs,
  getAllCitySlugs,
  getAllServiceSlugs,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE.url;
  const entries: MetadataRoute.Sitemap = [
    { url: `${base}/`, priority: 1 },
    { url: `${base}/browse`, priority: 0.7 },
  ];

  const [pairs, offices, cities, services] = await Promise.all([
    getServiceCityPairs(),
    getAllOfficeSlugs(),
    getAllCitySlugs(),
    getAllServiceSlugs(),
  ]);
  for (const service of services) {
    entries.push({ url: `${base}/${service}`, priority: 0.7 });
  }
  for (const city of cities) {
    entries.push({ url: `${base}/city/${city}`, priority: 0.7 });
  }
  for (const { service, city } of pairs) {
    entries.push({ url: `${base}/${service}/${city}`, priority: 0.9 });
  }
  for (const office of offices) {
    entries.push({ url: `${base}/office/${office}`, priority: 0.8 });
  }

  return entries;
}

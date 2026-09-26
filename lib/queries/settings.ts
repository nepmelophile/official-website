import "server-only";
import { cache } from "react";
import { DEFAULT_CONTACT_INFO, DEFAULT_HOMEPAGE_SETTINGS } from "@/lib/constants";
import { serializeContactInfo, serializeHomepageSettings } from "@/lib/serialize";
import { ContactInfo, type ContactInfoLean } from "@/models/ContactInfo";
import { HomepageSettings, type HomepageSettingsLean } from "@/models/HomepageSettings";
import { SINGLETON_KEY } from "@/models/shared";
import type { ContactInfoDTO, HomepageSettingsDTO } from "@/types/content";
import { safeQuery } from "./safe";

/**
 * Home page settings singleton. Falls back to DEFAULT_HOMEPAGE_SETTINGS when no document
 * exists or the DB is unavailable; empty lists (CTAs, stats) fall back to defaults too.
 */
export const getHomepageSettings = cache(async (): Promise<HomepageSettingsDTO> => {
  return safeQuery("getHomepageSettings", DEFAULT_HOMEPAGE_SETTINGS, async () => {
    const doc = await HomepageSettings.findOne({ key: SINGLETON_KEY }).lean<HomepageSettingsLean>();
    if (!doc) return DEFAULT_HOMEPAGE_SETTINGS;
    const settings = serializeHomepageSettings(doc);
    return {
      ...settings,
      heroHeadline: settings.heroHeadline || DEFAULT_HOMEPAGE_SETTINGS.heroHeadline,
      heroSubcopy: settings.heroSubcopy || DEFAULT_HOMEPAGE_SETTINGS.heroSubcopy,
      heroCtas: settings.heroCtas.length > 0 ? settings.heroCtas : DEFAULT_HOMEPAGE_SETTINGS.heroCtas,
      impactStats: settings.impactStats.length > 0 ? settings.impactStats : DEFAULT_HOMEPAGE_SETTINGS.impactStats,
    };
  });
});

async function findContactInfo(): Promise<ContactInfoDTO> {
  const doc = await ContactInfo.findOne({ key: SINGLETON_KEY }).lean<ContactInfoLean>();
  return doc ? serializeContactInfo(doc) : DEFAULT_CONTACT_INFO;
}

/** Contact info singleton, falling back to DEFAULT_CONTACT_INFO (strict inside requireLiveData renders). */
export const getContactInfo = cache(async (): Promise<ContactInfoDTO> => {
  return safeQuery("getContactInfo", DEFAULT_CONTACT_INFO, findContactInfo);
});

/**
 * Contact info for the site-wide Header/Footer. Always falls back instead of throwing: the
 * shared layout sits outside the (site) error boundary, and a strict page's own queries
 * already fail a regeneration during an outage, so the chrome never needs to.
 */
export const getSiteChromeContactInfo = cache(async (): Promise<ContactInfoDTO> => {
  return safeQuery("getSiteChromeContactInfo", DEFAULT_CONTACT_INFO, findContactInfo, { lenient: true });
});

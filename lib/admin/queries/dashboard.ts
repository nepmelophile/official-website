import "server-only";
import { connectToDatabase, isDbConfigured } from "@/lib/db";
import { serializeContactMessage } from "@/lib/serialize";
import { Article } from "@/models/Article";
import { Artist } from "@/models/Artist";
import { ContactMessage, type ContactMessageLean } from "@/models/ContactMessage";
import { Service } from "@/models/Service";
import { Testimonial } from "@/models/Testimonial";
import { TrendingItem } from "@/models/TrendingItem";
import type { ContactMessageDTO } from "@/types/content";

/*
 * Read helpers for the admin shell (dashboard + sidebar). Call only after requireAdmin().
 * They never throw: on DB failure they report `dbError` so the UI can show a notice.
 */

/** Number of messages with status "new" (0 when the DB is unavailable). */
export async function getUnreadMessageCount(): Promise<number> {
  if (!isDbConfigured()) return 0;
  try {
    await connectToDatabase();
    return await ContactMessage.countDocuments({ status: "new" });
  } catch {
    return 0;
  }
}

export interface DashboardCount {
  /** Published (articles/artists) or active (services/testimonials/trending) items. */
  live: number;
  /** Draft or inactive items. */
  hidden: number;
}

export interface DashboardData {
  counts: {
    articles: DashboardCount;
    artists: DashboardCount;
    services: DashboardCount;
    testimonials: DashboardCount;
    trending: DashboardCount;
    messages: { new: number; total: number };
  };
  latestMessages: ContactMessageDTO[];
  /** Human-readable problem when the DB could not be queried. */
  dbError?: string;
}

const EMPTY: DashboardData = {
  counts: {
    articles: { live: 0, hidden: 0 },
    artists: { live: 0, hidden: 0 },
    services: { live: 0, hidden: 0 },
    testimonials: { live: 0, hidden: 0 },
    trending: { live: 0, hidden: 0 },
    messages: { new: 0, total: 0 },
  },
  latestMessages: [],
};

export async function getDashboardData(): Promise<DashboardData> {
  if (!isDbConfigured()) {
    return { ...EMPTY, dbError: "MONGODB_URI is not set, so there is no content to manage yet." };
  }
  try {
    await connectToDatabase();
    const [
      articlesPublished,
      articlesDraft,
      artistsPublished,
      artistsDraft,
      servicesActive,
      servicesInactive,
      testimonialsActive,
      testimonialsInactive,
      trendingActive,
      trendingInactive,
      messagesNew,
      messagesTotal,
      latest,
    ] = await Promise.all([
      Article.countDocuments({ status: "published" }),
      Article.countDocuments({ status: "draft" }),
      Artist.countDocuments({ status: "published" }),
      Artist.countDocuments({ status: "draft" }),
      Service.countDocuments({ active: true }),
      Service.countDocuments({ active: { $ne: true } }),
      Testimonial.countDocuments({ active: true }),
      Testimonial.countDocuments({ active: { $ne: true } }),
      TrendingItem.countDocuments({ active: true }),
      TrendingItem.countDocuments({ active: { $ne: true } }),
      ContactMessage.countDocuments({ status: "new" }),
      ContactMessage.countDocuments({}),
      ContactMessage.find({}).sort({ createdAt: -1 }).limit(5).lean<ContactMessageLean[]>(),
    ]);
    return {
      counts: {
        articles: { live: articlesPublished, hidden: articlesDraft },
        artists: { live: artistsPublished, hidden: artistsDraft },
        services: { live: servicesActive, hidden: servicesInactive },
        testimonials: { live: testimonialsActive, hidden: testimonialsInactive },
        trending: { live: trendingActive, hidden: trendingInactive },
        messages: { new: messagesNew, total: messagesTotal },
      },
      latestMessages: latest.map(serializeContactMessage),
    };
  } catch (error) {
    console.error("[melophile admin] dashboard query failed", error);
    return { ...EMPTY, dbError: "The database is unreachable right now, so counts could not be loaded." };
  }
}

/**
 * Seeds the Melophile database with realistic (fictional) sample content.
 *
 *   pnpm db:up      # start local MongoDB on 127.0.0.1:27018 (docker compose)
 *   pnpm seed       # wipe + insert sample content
 *
 * Idempotent: every run wipes the content collections and inserts the same data again.
 * Contact messages are left untouched unless you pass --with-messages.
 * Refuses to run against a remote (Atlas) database unless you pass --force.
 */
import { config } from "dotenv";
import type { Types } from "mongoose";
import { DEFAULT_PAGE_SETTINGS } from "@/lib/constants";
import { connectToDatabase, disconnectFromDatabase } from "@/lib/db";
import { Article, type ArticleDoc } from "@/models/Article";
import { Artist, type ArtistDoc } from "@/models/Artist";
import { ContactInfo } from "@/models/ContactInfo";
import { ContactMessage } from "@/models/ContactMessage";
import { HomepageSettings } from "@/models/HomepageSettings";
import { PageSettings } from "@/models/PageSettings";
import { Service } from "@/models/Service";
import { SINGLETON_KEY } from "@/models/shared";
import { Testimonial } from "@/models/Testimonial";
import { TrendingItem } from "@/models/TrendingItem";

config({ path: [".env.local", ".env"], quiet: true });

const args = new Set(process.argv.slice(2));

function img(seed: string, w: number, h: number, alt: string) {
  return { url: `https://picsum.photos/seed/${seed}/${w}/${h}`, alt };
}

function daysAgo(days: number): Date {
  const d = new Date();
  d.setUTCHours(6, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - days);
  return d;
}

type SeedArticle = Omit<ArticleDoc, "createdAt" | "updatedAt" | "relatedArticleIds"> & { related?: string[] };
type SeedArtist = Omit<ArtistDoc, "createdAt" | "updatedAt" | "relatedArticleIds"> & { related?: string[] };

/* ------------------------------------------------------------------ */
/* Articles                                                            */
/* ------------------------------------------------------------------ */

const articles: SeedArticle[] = [
  {
    title: "Aakash Rai drops ‘Pahadko Gham’, a sun-soaked ode to the eastern hills",
    slug: "aakash-rai-pahadko-gham-release",
    featuredImage: img("aakash-rai-pahadko-gham", 1600, 1000, "Aakash Rai with an acoustic guitar on a hillside at golden hour"),
    excerpt:
      "The Dharan singer-songwriter's new single trades city melancholy for madal grooves, open-tuned guitars and a chorus built for bus-ride singalongs.",
    body: `Three years after his breakout EP *Sahar*, **Aakash Rai** is heading home. His new single, "Pahadko Gham" (Sunshine of the Hills), was written in a single afternoon at his grandmother's house above Dharan — and you can hear it.

## A warmer, looser sound

Where *Sahar* leaned on reverb-heavy synths and late-night introspection, "Pahadko Gham" is bright and unhurried. Open-tuned acoustic guitars sit on top of a rolling madal pattern played by Dharan percussionist Suman Limbu, while a bansuri line answers every chorus.

> "I wanted a song you could hear from the next terrace over. Something that sounds like the morning." — Aakash Rai

## Made with friends

The track was recorded live in two takes at a friend's studio in Itahari, then mixed in Kathmandu by producer **Bhairav Beats**, who kept the room noise in on purpose.

- **Release date:** out now on all platforms
- **Producer:** Bhairav Beats
- **Featuring:** Suman Limbu (madal), Pasang Sherpa (bansuri)

A music video shot across the Bhedetar ridge is due next month.`,
    category: "Release",
    tags: ["Aakash Rai", "Folk Pop", "Single"],
    author: "Prerana Shrestha",
    publishedAt: daysAgo(2),
    status: "published",
    embeds: [
      { url: "https://open.spotify.com/track/4k7b1XcY2pWq9mZtR8sLnA", title: "Pahadko Gham — Aakash Rai" },
      { url: "https://www.youtube.com/watch?v=Qm3pT8rXa1c", title: "Pahadko Gham (Lyric Video)" },
    ],
    related: ["bhairav-beats-maya-thapa-raat-ko-sahar", "ten-nepali-albums-that-defined-the-decade"],
    metaTitle: "Aakash Rai releases new single ‘Pahadko Gham’",
    metaDescription: "Dharan singer-songwriter Aakash Rai returns with a bright, madal-driven folk-pop single produced by Bhairav Beats.",
  },
  {
    title: "Inside The Kathmandu Drift’s DIY studio above a Thamel momo shop",
    slug: "inside-the-kathmandu-drift-diy-studio",
    featuredImage: img("kathmandu-drift-studio", 1600, 1000, "A cramped home studio with guitars and a vintage mixing desk"),
    excerpt:
      "Egg cartons on the walls, a borrowed tape machine and a lot of stubbornness: how Nepal's most-hyped indie band made their second record themselves.",
    body: `Climb three flights of stairs past the steam of a momo kitchen in Thamel and you'll find the room where **The Kathmandu Drift** made their second album, *Loadshedding Lullabies*.

## "We couldn't afford to wait"

"Studio time in Kathmandu is expensive, and we write slowly," says guitarist Nirajan Maharjan. "So we built our own. Badly, at first."

The band soundproofed the room with egg cartons and old carpets, borrowed a four-track tape machine from a Jawalakhel collector and learned to mix from YouTube tutorials.

## The songs

The album moves from jangly, sunlit guitar pop to long, droning closers that recall the city's power cuts of the 2000s — hence the title.

1. "Ring Road" — the lead single, already a staple of Kathmandu cafés
2. "Candlelight Homework" — a nostalgic slow-burner
3. "Basantapur, 2 AM" — seven minutes of feedback and field recordings

> "Every hum and hiss on this record is real. That's the sound of this city." — Rojina Tamang, vocals

*Loadshedding Lullabies* is out on the band's own label, Drift Records.`,
    category: "Interview",
    tags: ["The Kathmandu Drift", "Indie Rock", "Studio"],
    author: "Kiran Adhikari",
    publishedAt: daysAgo(5),
    status: "published",
    embeds: [{ url: "https://open.spotify.com/album/2Ls9vQwX4nTz8kYpR1cMbE", title: "Loadshedding Lullabies" }],
    related: ["jhamsikhel-sessions-returns-november"],
  },
  {
    title: "Jhamsikhel Sessions returns this November with 12 independent acts",
    slug: "jhamsikhel-sessions-returns-november",
    featuredImage: img("jhamsikhel-sessions-stage", 1600, 1000, "A crowd in front of an outdoor stage lit in red at night"),
    excerpt:
      "The open-air showcase is back for its fourth edition, spotlighting emerging artists from Kathmandu, Pokhara, Dharan and Butwal across two nights.",
    body: `The **Jhamsikhel Sessions** — the open-air showcase that has quietly become one of the best places to discover new Nepali music — returns on **21–22 November** for its fourth edition.

## The line-up

Twelve independent acts will play across two nights, including:

- **Sunita Gurung** with a full folk-fusion ensemble
- **The Kathmandu Drift**, previewing songs from *Loadshedding Lullabies*
- **Maya Thapa**'s first-ever live band set
- A late-night DJ set from **Bhairav Beats**

## Tickets and access

Early-bird passes are available now, with a limited number of free student tickets released every Friday. The venue is step-free, and a quiet zone will be available for anyone who needs a break from the crowd.

> "The idea has always been simple: give new artists a real stage and a real sound system." — organiser Anisha Karki

Melophile is a media partner for this year's edition and will be publishing interviews with the artists in the run-up to the festival.`,
    category: "Event",
    tags: ["Live", "Festival", "Kathmandu"],
    author: "Anisha Karki",
    publishedAt: daysAgo(8),
    status: "published",
    embeds: [{ url: "https://www.youtube.com/watch?v=Jh7sN2kLp4Q", title: "Jhamsikhel Sessions 2025 — Aftermovie" }],
    related: ["sunita-gurung-sarangi-main-stage"],
  },
  {
    title: "How Nepali streaming numbers doubled in two years — and who is actually getting paid",
    slug: "nepali-streaming-numbers-doubled",
    featuredImage: img("nepal-streaming-industry", 1600, 1000, "A phone showing a music streaming app on a café table"),
    excerpt:
      "Cheaper data, local playlists and a new generation of bedroom producers have transformed how Nepal listens. The money is still catching up.",
    body: `Nepali artists are being streamed more than ever. Across the major platforms, plays of Nepali-language tracks have roughly **doubled in two years**, according to distributor estimates shared with Melophile.

## What changed

- **Cheaper mobile data** made streaming the default for listeners under 30
- **Local editorial playlists** gave independent artists a path to discovery
- **Bedroom production** lowered the cost of releasing music to almost nothing

## The catch

Streams are not the same as income. Per-stream payouts in South Asia remain among the lowest in the world, and many artists still lose a cut to opaque distribution deals.

> "A hundred thousand streams sounds huge until you see the cheque. Artists need to own their masters and understand their contracts." — music lawyer Rabin Joshi

## What artists can do

1. Register songs with a collecting society so you're paid for public performance
2. Read distribution terms carefully — avoid deals that take ownership of your masters
3. Build direct income: live shows, merch and brand partnerships

Melophile's artist services team runs free monthly clinics on distribution and rights. [Get in touch](/contact) to book a slot.`,
    category: "Industry",
    tags: ["Streaming", "Business", "Royalties"],
    author: "Rabin Joshi",
    publishedAt: daysAgo(12),
    status: "published",
    embeds: [],
    related: ["melophile-launches-artist-services"],
  },
  {
    title: "Sunita Gurung on bringing the sarangi to the festival main stage",
    slug: "sunita-gurung-sarangi-main-stage",
    featuredImage: img("sunita-gurung-sarangi", 1600, 1000, "Sunita Gurung playing a sarangi on stage under warm lights"),
    excerpt:
      "The Pokhara musician talks about learning from Gandharba masters, remixing lok geet and why tradition should never be kept behind glass.",
    body: `**Sunita Gurung** first picked up a sarangi at eleven, taught by a Gandharba musician who played for tourists on the Pokhara lakeside. Two decades later, she's filling festival main stages with a sound that fuses lok geet, dub basslines and field recordings from the Annapurna foothills.

## On learning the instrument

"My teacher never wrote anything down. He'd play a phrase, and I'd copy it until my fingers bled. That's how the music survived — person to person."

## On fusion

> "People ask if mixing electronics with folk is disrespectful. I think keeping it in a museum is more disrespectful. These songs were always meant to move."

## What's next

Sunita is recording a new EP, *Ghatu*, with Bhairav Beats and plans a residency programme that pairs young producers with traditional musicians.

She headlines the first night of the Jhamsikhel Sessions this November.`,
    category: "Feature",
    tags: ["Sunita Gurung", "Folk Fusion", "Sarangi"],
    author: "Prerana Shrestha",
    publishedAt: daysAgo(16),
    status: "published",
    embeds: [{ url: "https://soundcloud.com/sunita-gurung-music/ghatu-dub", title: "Ghatu (Dub) — Sunita Gurung" }],
    related: ["jhamsikhel-sessions-returns-november", "ten-nepali-albums-that-defined-the-decade"],
  },
  {
    title: "Bhairav Beats and Maya Thapa team up on late-night single ‘Raat Ko Sahar’",
    slug: "bhairav-beats-maya-thapa-raat-ko-sahar",
    featuredImage: img("raat-ko-sahar-single", 1600, 1000, "A neon-lit Kathmandu street at night"),
    excerpt:
      "A slow-burning R&B collaboration about Kathmandu after midnight, built on a sampled damphu loop and Maya Thapa's most restrained vocal yet.",
    body: `Lalitpur producer **Bhairav Beats** and Butwal vocalist **Maya Thapa** have finally made the collaboration fans have been asking for.

"Raat Ko Sahar" (City at Night) is a hazy, slow-burning R&B track built around a chopped **damphu** sample and warm, detuned synths. Maya's vocal is intimate and close-miked — she recorded it at 3 AM "because that's when the song lives".

## Behind the track

- Written over voice notes between Lalitpur and Butwal during monsoon
- The damphu loop was recorded by Bhairav's uncle in Makwanpur
- Mixed and mastered in Kathmandu

> "Maya can make one word feel like a whole verse. I just tried to stay out of her way." — Bhairav Beats

The pair will perform the song live for the first time at the Jhamsikhel Sessions.`,
    category: "Release",
    tags: ["Bhairav Beats", "Maya Thapa", "R&B", "Single"],
    author: "Kiran Adhikari",
    publishedAt: daysAgo(20),
    status: "published",
    embeds: [
      { url: "https://open.spotify.com/track/7aQv2RmW9xLp3NcT5bYkZe", title: "Raat Ko Sahar" },
      { url: "https://youtu.be/Rk8sPq2vNaw", title: "Raat Ko Sahar (Official Video)" },
    ],
    related: ["aakash-rai-pahadko-gham-release"],
  },
  {
    title: "Ten Nepali albums that defined the decade",
    slug: "ten-nepali-albums-that-defined-the-decade",
    featuredImage: img("ten-nepali-albums-decade", 1600, 1000, "A stack of vinyl records and cassettes on a wooden shelf"),
    excerpt:
      "From basement rock to bedroom R&B, the records that changed what Nepali music could sound like — chosen by the Melophile team.",
    body: `Choosing ten albums from a decade this rich was never going to be easy. These are the records that changed what Nepali music could sound like — and who got to make it.

## The list

1. **Loadshedding Lullabies** — The Kathmandu Drift
2. **Sahar** (EP) — Aakash Rai
3. **Ghatu Sessions** — Sunita Gurung
4. **Concrete Monsoon** — Bhairav Beats
5. **Nilo** — Maya Thapa
6. **Above the Tea Gardens** — Himal Echoes
7. **Ring Road Tapes** — various artists
8. **Dhulo** — Kalo Pahad
9. **Sano Sansar** — The Lakeside Collective
10. **Bato** — Rupa & the Rivers

## Why these?

Each of these records either opened a door — a new sound, a new scene, a new way of releasing music — or proved that independent Nepali artists could compete with anything on the global playlists.

> Disagree? Good. [Tell us your list.](/contact)`,
    category: "Feature",
    tags: ["Lists", "Albums", "Decade"],
    author: "Melophile Editorial",
    publishedAt: daysAgo(27),
    status: "published",
    embeds: [{ url: "https://open.spotify.com/playlist/5Ym2xQk8LwRt3VbN7cPzHd", title: "Melophile: Albums of the Decade" }],
    related: ["inside-the-kathmandu-drift-diy-studio"],
  },
  {
    title: "Melophile launches artist services for independent Nepali musicians",
    slug: "melophile-launches-artist-services",
    featuredImage: img("melophile-artist-services", 1600, 1000, "Musicians and producers in a meeting around a laptop"),
    excerpt:
      "Distribution, promotion, music video production and PR — built for independent artists who want to grow without signing away their rights.",
    body: `Today we're launching **Melophile Artist Services**: practical, fairly priced support for independent Nepali musicians.

## What we offer

- **Artist management & promotion** — release plans, playlist pitching and social strategy
- **Music distribution** — get your music on every major platform while keeping 100% of your masters
- **Music video production** — from concept to final cut, with crews in Kathmandu and Pokhara
- **PR & press** — press releases, interviews and coverage across Nepal and the diaspora

## Why we're doing this

After years of writing about brilliant artists who struggled with the business side, we wanted to do more than tell their stories.

> "Talent is everywhere in Nepal. Access isn't. We want to change that." — Melophile team

Explore the [services page](/services) or [contact us](/contact) to talk about your next release.`,
    category: "News",
    tags: ["Melophile", "Services", "Announcement"],
    author: "Melophile Team",
    publishedAt: daysAgo(34),
    status: "published",
    embeds: [],
    related: ["nepali-streaming-numbers-doubled"],
  },
  {
    title: "Himal Echoes announce debut album ‘Above the Clouds’",
    slug: "himal-echoes-debut-album-announcement",
    featuredImage: img("himal-echoes-album", 1600, 1000, "Mountains rising above a sea of clouds at sunrise"),
    excerpt: "The Ilam post-rock quartet will release their long-awaited debut album early next year. (Draft — not yet published.)",
    body: `**Himal Echoes** have confirmed their debut album, *Above the Clouds*, recorded in a tea-estate guesthouse in Ilam.

More details, including the tracklist and tour dates, will be announced soon.`,
    category: "Release",
    tags: ["Himal Echoes", "Post-Rock", "Album"],
    author: "Kiran Adhikari",
    publishedAt: daysAgo(-7),
    status: "draft",
    embeds: [],
  },
];

/* ------------------------------------------------------------------ */
/* Artists                                                             */
/* ------------------------------------------------------------------ */

const artists: SeedArtist[] = [
  {
    name: "Aakash Rai",
    slug: "aakash-rai",
    photo: img("aakash-rai-portrait", 900, 1125, "Portrait of Aakash Rai in a denim jacket"),
    coverImage: img("aakash-rai-cover", 1920, 800, "Rolling green hills of eastern Nepal"),
    shortBio: "Dharan-born singer-songwriter blending folk storytelling with warm, modern pop production.",
    bio: `**Aakash Rai** grew up between Dharan's busy bazaar and his grandparents' village in the eastern hills — two worlds that shape everything he writes.

His 2023 EP *Sahar* became a quiet word-of-mouth hit, racking up millions of streams without a label or a marketing budget. His songs are about leaving home, missing home and finally going back.

Live, Aakash plays with a four-piece band built around madal, bansuri and acoustic guitars.`,
    genres: ["Folk Pop", "Singer-Songwriter"],
    location: "Dharan, Nepal",
    socialLinks: [
      { platform: "spotify", url: "https://open.spotify.com/artist/3xk9QmR2vLp8NcT4bYwZaE" },
      { platform: "instagram", url: "https://www.instagram.com/aakashrai.music" },
      { platform: "youtube", url: "https://www.youtube.com/@aakashraimusic" },
    ],
    releases: [
      {
        title: "Pahadko Gham",
        embedUrl: "https://open.spotify.com/track/4k7b1XcY2pWq9mZtR8sLnA",
        type: "single",
        releaseDate: daysAgo(2),
        coverImage: img("pahadko-gham-cover", 800, 800, "Pahadko Gham single cover art"),
      },
      {
        title: "Sahar",
        embedUrl: "https://open.spotify.com/album/6Tq3mN8xVb2KpL9cRw4YzA",
        type: "ep",
        releaseDate: new Date("2023-04-14"),
        coverImage: img("sahar-ep-cover", 800, 800, "Sahar EP cover art"),
      },
    ],
    media: [
      { type: "image", url: "https://picsum.photos/seed/aakash-rai-live-1/1200/800", caption: "Live at Purple Haze, Kathmandu" },
      { type: "image", url: "https://picsum.photos/seed/aakash-rai-live-2/1200/800", caption: "Soundcheck in Dharan" },
      { type: "video", url: "https://www.youtube.com/watch?v=Qm3pT8rXa1c", caption: "Pahadko Gham (Lyric Video)" },
    ],
    achievements: [
      { title: "Best New Artist — Kathmandu Music Awards", year: 2024 },
      { title: "Sahar EP passes 5 million streams", year: 2025, description: "Fully independent, no label support." },
    ],
    related: ["aakash-rai-pahadko-gham-release", "ten-nepali-albums-that-defined-the-decade"],
    featured: true,
    order: 1,
    status: "published",
  },
  {
    name: "The Kathmandu Drift",
    slug: "the-kathmandu-drift",
    photo: img("kathmandu-drift-band", 900, 1125, "The Kathmandu Drift band members on a rooftop"),
    coverImage: img("kathmandu-drift-cover", 1920, 800, "Kathmandu rooftops at dusk"),
    shortBio: "Four-piece indie rock band making jangly, nostalgic guitar music about growing up in the capital.",
    bio: `**The Kathmandu Drift** formed in a Baneshwor college canteen in 2019. Their sound — jangly guitars, big choruses and lyrics about power cuts, ring roads and first loves — has made them the most-talked-about band in the city's indie scene.

They self-produced their second album *Loadshedding Lullabies* in a DIY studio above a Thamel momo shop.

**Members:** Rojina Tamang (vocals), Nirajan Maharjan (guitar), Sujan K.C. (bass), Dawa Lama (drums).`,
    genres: ["Indie Rock", "Alternative"],
    location: "Kathmandu, Nepal",
    socialLinks: [
      { platform: "spotify", url: "https://open.spotify.com/artist/1Bw7QmX3kLp9NcT2vYrZdE" },
      { platform: "instagram", url: "https://www.instagram.com/thekathmandudrift" },
      { platform: "facebook", url: "https://www.facebook.com/thekathmandudrift" },
      { platform: "website", url: "https://thekathmandudrift.example.com" },
    ],
    releases: [
      {
        title: "Loadshedding Lullabies",
        embedUrl: "https://open.spotify.com/album/2Ls9vQwX4nTz8kYpR1cMbE",
        type: "album",
        releaseDate: daysAgo(40),
        coverImage: img("loadshedding-lullabies-cover", 800, 800, "Loadshedding Lullabies album cover"),
      },
      {
        title: "Ring Road",
        embedUrl: "https://www.youtube.com/watch?v=Tn4kW8pLq2s",
        type: "single",
        releaseDate: daysAgo(70),
      },
    ],
    media: [
      { type: "image", url: "https://picsum.photos/seed/kathmandu-drift-live/1200/800", caption: "Headlining Tangalwood" },
      { type: "image", url: "https://picsum.photos/seed/kathmandu-drift-studio-2/1200/800", caption: "In the Thamel studio" },
    ],
    achievements: [{ title: "Album of the Year shortlist — Nepal Indie Awards", year: 2025 }],
    related: ["inside-the-kathmandu-drift-diy-studio"],
    featured: true,
    order: 2,
    status: "published",
  },
  {
    name: "Sunita Gurung",
    slug: "sunita-gurung",
    photo: img("sunita-gurung-portrait", 900, 1125, "Sunita Gurung holding a sarangi"),
    coverImage: img("sunita-gurung-cover", 1920, 800, "Phewa Lake with the Annapurna range behind"),
    shortBio: "Pokhara sarangi player fusing lok geet with dub, electronics and Himalayan field recordings.",
    bio: `**Sunita Gurung** learned the sarangi from a Gandharba master on the Pokhara lakeside. Today she leads a folk-fusion ensemble that brings traditional instruments to festival main stages across Nepal and India.

Her music draws on Gurung and Gandharba folk traditions, reshaped with dub basslines and electronic textures.`,
    genres: ["Folk Fusion", "Lok Dohori"],
    location: "Pokhara, Nepal",
    socialLinks: [
      { platform: "soundcloud", url: "https://soundcloud.com/sunita-gurung-music" },
      { platform: "instagram", url: "https://www.instagram.com/sunitagurung.sarangi" },
      { platform: "youtube", url: "https://www.youtube.com/@sunitagurung" },
    ],
    releases: [
      {
        title: "Ghatu (Dub)",
        embedUrl: "https://soundcloud.com/sunita-gurung-music/ghatu-dub",
        type: "single",
        releaseDate: daysAgo(30),
      },
      {
        title: "Ghatu Sessions",
        embedUrl: "https://open.spotify.com/album/0Pq8vLw3XnTz2kYbR5cMhF",
        type: "album",
        releaseDate: new Date("2022-10-01"),
        coverImage: img("ghatu-sessions-cover", 800, 800, "Ghatu Sessions album cover"),
      },
    ],
    media: [
      { type: "image", url: "https://picsum.photos/seed/sunita-gurung-stage/1200/800", caption: "Main stage, Pokhara Street Festival" },
      { type: "video", url: "https://www.youtube.com/watch?v=Sg5nV2kLp7w", caption: "Live sarangi session" },
    ],
    achievements: [
      { title: "Performed at Ziro Festival, India", year: 2024 },
      { title: "Folk Innovation Grant — Nepal Arts Council", year: 2023 },
    ],
    related: ["sunita-gurung-sarangi-main-stage", "jhamsikhel-sessions-returns-november"],
    featured: true,
    order: 3,
    status: "published",
  },
  {
    name: "Bhairav Beats",
    slug: "bhairav-beats",
    photo: img("bhairav-beats-portrait", 900, 1125, "Bhairav Beats behind a drum machine"),
    coverImage: img("bhairav-beats-cover", 1920, 800, "Patan Durbar Square at night"),
    shortBio: "Lalitpur producer and DJ building hip-hop and electronic tracks out of traditional Nepali samples.",
    bio: `**Bhairav Beats** is the alias of Lalitpur producer Sanjay Shakya. He crate-digs old Radio Nepal recordings and records his own damphu, madal and dhime loops, flipping them into dusty hip-hop and late-night electronic music.

He's produced for many of the artists on Melophile's radar and runs a monthly beat-making night in Patan.`,
    genres: ["Hip Hop", "Electronic"],
    location: "Lalitpur, Nepal",
    socialLinks: [
      { platform: "spotify", url: "https://open.spotify.com/artist/5Hy3QmX8kLp2NcT7vYrZbF" },
      { platform: "soundcloud", url: "https://soundcloud.com/bhairavbeats" },
      { platform: "instagram", url: "https://www.instagram.com/bhairavbeats" },
      { platform: "tiktok", url: "https://www.tiktok.com/@bhairavbeats" },
    ],
    releases: [
      {
        title: "Raat Ko Sahar (with Maya Thapa)",
        embedUrl: "https://open.spotify.com/track/7aQv2RmW9xLp3NcT5bYkZe",
        type: "single",
        releaseDate: daysAgo(20),
        coverImage: img("raat-ko-sahar-cover", 800, 800, "Raat Ko Sahar single cover"),
      },
      {
        title: "Concrete Monsoon",
        embedUrl: "https://open.spotify.com/album/3Rk7vQw2XnTz9kYpL1cMbG",
        type: "album",
        releaseDate: new Date("2024-07-20"),
      },
    ],
    media: [{ type: "image", url: "https://picsum.photos/seed/bhairav-beats-dj/1200/800", caption: "DJ set in Patan" }],
    achievements: [{ title: "Producer of the Year — Kathmandu Music Awards", year: 2025 }],
    related: ["bhairav-beats-maya-thapa-raat-ko-sahar"],
    featured: false,
    order: 4,
    status: "published",
  },
  {
    name: "Maya Thapa",
    slug: "maya-thapa",
    photo: img("maya-thapa-portrait", 900, 1125, "Maya Thapa in soft studio light"),
    coverImage: img("maya-thapa-cover", 1920, 800, "City lights reflected on a wet street"),
    shortBio: "Butwal R&B and soul vocalist with a voice made for 3 AM — intimate, restrained and devastating.",
    bio: `**Maya Thapa** started posting covers from her bedroom in Butwal at seventeen. Her debut EP *Nilo* turned her into one of the most distinctive voices in Nepali R&B.

Her songs sit somewhere between classic soul, modern R&B and the Nepali adhunik songs her mother sang around the house.`,
    genres: ["R&B", "Soul"],
    location: "Butwal, Nepal",
    socialLinks: [
      { platform: "apple-music", url: "https://music.apple.com/np/artist/maya-thapa/1234567890" },
      { platform: "instagram", url: "https://www.instagram.com/mayathapa.music" },
      { platform: "x", url: "https://x.com/mayathapamusic" },
    ],
    releases: [
      {
        title: "Timro Yaad",
        embedUrl: "https://www.youtube.com/watch?v=Mt9kW3pLq5x",
        type: "single",
        releaseDate: daysAgo(55),
      },
      {
        title: "Nilo",
        embedUrl: "https://open.spotify.com/album/4Mn2vQw7XnTz1kYpR8cLbH",
        type: "ep",
        releaseDate: new Date("2024-02-09"),
        coverImage: img("nilo-ep-cover", 800, 800, "Nilo EP cover in deep blue"),
      },
    ],
    media: [
      { type: "image", url: "https://picsum.photos/seed/maya-thapa-live/1200/800", caption: "First live band rehearsal" },
      { type: "video", url: "https://youtu.be/Rk8sPq2vNaw", caption: "Raat Ko Sahar (Official Video)" },
    ],
    achievements: [{ title: "Nilo EP named in ‘Ten Albums of the Decade’", year: 2026 }],
    related: ["bhairav-beats-maya-thapa-raat-ko-sahar"],
    featured: true,
    order: 5,
    status: "published",
  },
  {
    name: "Himal Echoes",
    slug: "himal-echoes",
    photo: img("himal-echoes-band", 900, 1125, "Himal Echoes performing in fog"),
    coverImage: img("himal-echoes-cover", 1920, 800, "Tea gardens of Ilam in mist"),
    shortBio: "Ilam post-rock quartet writing slow-building instrumental music inspired by mountains and mist.",
    bio: `**Himal Echoes** are four friends from Ilam who write long, patient, instrumental songs — delay-soaked guitars, bowed bass and drums that build like weather rolling in over the tea gardens.

Their debut album is due early next year.`,
    genres: ["Post-Rock", "Ambient"],
    location: "Ilam, Nepal",
    socialLinks: [
      { platform: "youtube", url: "https://www.youtube.com/@himalechoes" },
      { platform: "instagram", url: "https://www.instagram.com/himalechoes" },
    ],
    releases: [
      {
        title: "Above the Tea Gardens",
        embedUrl: "https://www.youtube.com/watch?v=He2kW7pLq9z",
        type: "ep",
        releaseDate: new Date("2023-11-11"),
      },
    ],
    media: [{ type: "image", url: "https://picsum.photos/seed/himal-echoes-live/1200/800", caption: "Live in Ilam" }],
    achievements: [],
    related: [],
    featured: false,
    order: 6,
    status: "published",
  },
];

/* ------------------------------------------------------------------ */
/* Services & testimonials                                             */
/* ------------------------------------------------------------------ */

const services = [
  {
    name: "Artist Management & Promotion",
    slug: "artist-management-promotion",
    image: img("service-artist-management", 1200, 900, "An artist planning a release calendar on a whiteboard"),
    description: "Release strategy, playlist pitching and social campaigns that grow a real audience — not vanity numbers.",
    details: `We work alongside you on every release:

- Release plans and timelines
- Editorial playlist pitching
- Social content strategy and ad campaigns
- Monthly reporting you can actually understand`,
    formLink: "/contact?service=artist-management-promotion",
    order: 1,
    active: true,
  },
  {
    name: "Music Distribution",
    slug: "music-distribution",
    image: img("service-music-distribution", 1200, 900, "Streaming app screens showing a new release"),
    description: "Get your music on Spotify, Apple Music, YouTube Music and more — and keep 100% of your masters.",
    details: `- Delivery to all major platforms worldwide
- Content ID and YouTube monetisation
- Royalty reporting and split payments
- Free rights and registration guidance`,
    formLink: "/contact?service=music-distribution",
    order: 2,
    active: true,
  },
  {
    name: "Music Video Production",
    slug: "music-video-production",
    image: img("service-music-video", 1200, 900, "A film crew shooting a music video at night"),
    description: "Concept to final cut, with crews in Kathmandu and Pokhara and budgets that respect independent artists.",
    details: `- Creative treatments and storyboards
- Location scouting across Nepal
- Shooting, editing and colour grading
- Vertical cut-downs for Reels and TikTok`,
    formLink: "/contact?service=music-video-production",
    order: 3,
    active: true,
  },
  {
    name: "PR & Press Coverage",
    slug: "pr-press-coverage",
    image: img("service-pr-press", 1200, 900, "Newspapers and a microphone on a desk"),
    description: "Press releases, interviews and coverage across Nepali media and the global diaspora press.",
    details: `- Press kit and bio writing
- Targeted media outreach in Nepal and abroad
- Interview and feature placement
- Launch-day coordination`,
    formLink: "/contact?service=pr-press-coverage",
    order: 4,
    active: true,
  },
];

const testimonials = [
  {
    name: "Aakash Rai",
    designation: "Singer-songwriter, Dharan",
    image: img("testimonial-aakash-rai", 200, 200, "Aakash Rai"),
    quote: "Melophile helped me plan my first proper release. For the first time it felt like someone understood both the music and the business.",
    order: 1,
    active: true,
    featured: true,
    source: { label: "Interview, Melophile Sessions", url: "https://www.youtube.com/@melophilenp" },
  },
  {
    name: "Rojina Tamang",
    designation: "Vocalist, The Kathmandu Drift",
    image: img("testimonial-rojina-tamang", 200, 200, "Rojina Tamang"),
    quote: "They got our record in front of people we'd never have reached on our own — and they never once asked us to change our sound.",
    order: 2,
    active: true,
    featured: true,
    source: { label: "Instagram post" },
  },
  {
    name: "Sunita Gurung",
    designation: "Sarangi player & composer",
    image: img("testimonial-sunita-gurung", 200, 200, "Sunita Gurung"),
    quote: "The music video team treated our folk traditions with real respect. The result was beautiful.",
    order: 3,
    active: true,
  },
  {
    name: "Anisha Karki",
    designation: "Organiser, Jhamsikhel Sessions",
    quote: "Melophile is the first place I look for new Nepali artists. Their coverage genuinely moves ticket sales.",
    order: 4,
    active: true,
  },
];

/* ------------------------------------------------------------------ */
/* Run                                                                 */
/* ------------------------------------------------------------------ */

function assertSafeTarget(uri: string): void {
  const isLocal = /mongodb:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|mongo)(:\d+)?\//.test(uri);
  if (!isLocal && !args.has("--force")) {
    console.error(
      "Refusing to seed a non-local database (this script WIPES content collections).\n" +
        "Re-run with --force if you really mean it:  pnpm seed -- --force",
    );
    process.exit(1);
  }
}

async function main(): Promise<void> {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    console.error("MONGODB_URI is not set. Copy .env.example to .env.local (and run `pnpm db:up`).");
    process.exit(1);
  }
  assertSafeTarget(uri);

  console.log("Connecting…");
  await connectToDatabase();

  console.log("Wiping content collections…");
  await Promise.all([
    Article.deleteMany({}),
    Artist.deleteMany({}),
    Service.deleteMany({}),
    Testimonial.deleteMany({}),
    TrendingItem.deleteMany({}),
    HomepageSettings.deleteMany({}),
    PageSettings.deleteMany({}),
    ContactInfo.deleteMany({}),
    ...(args.has("--with-messages") ? [ContactMessage.deleteMany({})] : []),
  ]);

  console.log("Syncing indexes…");
  await Promise.all(
    [Article, Artist, Service, Testimonial, TrendingItem, HomepageSettings, PageSettings, ContactInfo, ContactMessage].map((m) =>
      m.syncIndexes(),
    ),
  );

  // Articles (two passes: insert, then wire up related ids by slug).
  // `related` is seed-only metadata (strict schema drops it); ids are wired up below.
  const insertedArticles = await Article.insertMany(
    articles.map((a) => ({ ...a, related: undefined, relatedArticleIds: [] as Types.ObjectId[] })),
  );
  const articleIdBySlug = new Map<string, Types.ObjectId>(insertedArticles.map((a) => [a.slug, a._id]));
  const idsFor = (slugs: string[] | undefined) =>
    (slugs ?? []).map((s) => articleIdBySlug.get(s)).filter((id): id is Types.ObjectId => Boolean(id));

  await Promise.all(
    articles
      .filter((a) => a.related?.length)
      .map((a) => Article.updateOne({ slug: a.slug }, { $set: { relatedArticleIds: idsFor(a.related) } })),
  );
  console.log(`  ✓ ${insertedArticles.length} articles`);

  const insertedArtists = await Artist.insertMany(
    artists.map(({ related, ...a }) => ({ ...a, relatedArticleIds: idsFor(related) })),
  );
  const artistIdBySlug = new Map<string, Types.ObjectId>(insertedArtists.map((a) => [a.slug, a._id]));
  const artistId = (slug: string): Types.ObjectId => {
    const id = artistIdBySlug.get(slug);
    if (!id) throw new Error(`Unknown artist slug: ${slug}`);
    return id;
  };
  const articleId = (slug: string): Types.ObjectId => {
    const id = articleIdBySlug.get(slug);
    if (!id) throw new Error(`Unknown article slug: ${slug}`);
    return id;
  };
  console.log(`  ✓ ${insertedArtists.length} artists`);

  await Service.insertMany(services);
  console.log(`  ✓ ${services.length} services`);

  await Testimonial.insertMany(testimonials);
  console.log(`  ✓ ${testimonials.length} testimonials`);

  const trending = [
    { type: "artist", refId: artistId("aakash-rai"), rank: 1, manualOverride: false, active: true, movement: "steady" },
    { type: "song", refId: artistId("bhairav-beats"), rank: 2, manualOverride: false, active: true, movement: "up" },
    {
      type: "update",
      refId: articleId("jhamsikhel-sessions-returns-november"),
      rank: 3,
      manualOverride: false,
      active: true,
      movement: "new",
    },
    {
      type: "song",
      refId: artistId("maya-thapa"),
      rank: 4,
      manualOverride: true,
      active: true,
      title: "Timro Yaad (Live at Purple Haze)",
      subtitle: "Maya Thapa",
      image: img("timro-yaad-live", 800, 800, "Maya Thapa performing live under purple lights"),
      href: "/artists/maya-thapa",
      embedUrl: "https://www.youtube.com/watch?v=Mt9kW3pLq5x",
      movement: "up",
    },
    { type: "artist", refId: artistId("the-kathmandu-drift"), rank: 5, manualOverride: false, active: true, movement: "down" },
    { type: "update", refId: articleId("nepali-streaming-numbers-doubled"), rank: 6, manualOverride: false, active: true },
    {
      type: "artist",
      rank: 7,
      manualOverride: true,
      active: false,
      title: "Kalo Pahad",
      subtitle: "Hidden — example of an inactive item",
    },
  ];
  await TrendingItem.insertMany(trending);
  console.log(`  ✓ ${trending.length} trending items`);

  await HomepageSettings.create({
    key: SINGLETON_KEY,
    heroHeadline: "The sound of Nepal, amplified.",
    heroSubcopy:
      "News, stories and services for the artists shaping Nepali music — from Kathmandu basements to global playlists.",
    heroImage: img("melophile-hero-crowd", 2400, 1400, "A concert crowd with hands raised under red stage lights"),
    heroCtas: [
      { label: "Read the latest", href: "/news" },
      { label: "Work with us", href: "/contact" },
    ],
    impactStats: [
      { label: "Artists supported", value: 120, suffix: "+" },
      { label: "Stories published", value: 850, suffix: "+" },
      { label: "Streams generated", value: 25, suffix: "M" },
      { label: "Live events partnered", value: 45, suffix: "+" },
    ],
    featuredArticleIds: [
      articleId("aakash-rai-pahadko-gham-release"),
      articleId("inside-the-kathmandu-drift-diy-studio"),
      articleId("jhamsikhel-sessions-returns-november"),
    ],
    featuredArtistIds: [
      artistId("aakash-rai"),
      artistId("the-kathmandu-drift"),
      artistId("sunita-gurung"),
      artistId("maya-thapa"),
    ],
  });
  console.log("  ✓ homepage settings");

  // Managed pages (/trending, /testimonials): the same defaults the site uses with no document
  // (undefined SEO fields are simply not stored).
  await PageSettings.insertMany(Object.values(DEFAULT_PAGE_SETTINGS));
  console.log("  ✓ page settings (trending, testimonials)");

  await ContactInfo.create({
    key: SINGLETON_KEY,
    email: "hello@melophilenp.com",
    phone: "+977 1-5550123",
    address: "Jhamsikhel Marg, Lalitpur 44600, Nepal",
    mapEmbedUrl: "https://www.google.com/maps?q=Jhamsikhel,+Lalitpur,+Nepal&output=embed",
    officeHours: "Sun–Fri, 10:00–18:00 NPT",
    socialLinks: [
      { platform: "instagram", url: "https://www.instagram.com/melophilenp" },
      { platform: "facebook", url: "https://www.facebook.com/melophilenp" },
      { platform: "youtube", url: "https://www.youtube.com/@melophilenp" },
      { platform: "spotify", url: "https://open.spotify.com/user/melophilenp" },
      { platform: "tiktok", url: "https://www.tiktok.com/@melophilenp" },
    ],
  });
  console.log("  ✓ contact info");

  if (args.has("--with-messages")) {
    await ContactMessage.insertMany([
      {
        name: "Pasang Sherpa",
        email: "pasang@example.com",
        subject: "Distribution for my debut EP",
        service: "Music Distribution",
        message: "Hi! I'm releasing a five-track EP next month and would love to know how your distribution works.",
        status: "new",
      },
      {
        name: "Ritika Joshi",
        email: "ritika@example.com",
        phone: "+977 9800000000",
        subject: "Interview request",
        message: "I'm a journalist in London writing about the Nepali indie scene. Could I interview your editors?",
        status: "read",
      },
    ]);
    console.log("  ✓ 2 sample contact messages");
  }

  console.log("Done. Seeded Melophile sample content.");
}

main()
  .catch((error: unknown) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectFromDatabase();
  });

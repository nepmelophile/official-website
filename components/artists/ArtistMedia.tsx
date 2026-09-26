import { Embed } from "@/components/ui/Embed";
import { Section, type SectionTone } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { cn } from "@/lib/utils";
import type { ArtistMedia as ArtistMediaItem } from "@/types/content";
import { ArtistGallery, type GalleryImage } from "./ArtistGallery";
import { META } from "./styles";

export interface ArtistMediaProps {
  artistName: string;
  media: ArtistMediaItem[];
  index: number;
  tone?: SectionTone;
}

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

/** Photos (grid + lightbox) and videos (embedded players) from the artist's media list. */
export function ArtistMedia({ artistName, media, index, tone = "default" }: ArtistMediaProps) {
  const images: GalleryImage[] = media
    .filter((item) => item.type === "image" && isHttpUrl(item.url))
    .map((item, i) => ({
      url: item.url.trim(),
      caption: item.caption?.trim() || undefined,
      alt: item.caption?.trim() || `${artistName} — photo ${i + 1}`,
    }));
  const videos = media.filter((item) => item.type === "video" && isHttpUrl(item.url));

  if (images.length === 0 && videos.length === 0) return null;

  return (
    <Section tone={tone} aria-labelledby="artist-media-title">
      <SectionHeading
        id="artist-media-title"
        index={index}
        eyebrow="Media"
        title={
          images.length > 0 ? (
            <>
              On stage &amp; <em>off</em>
            </>
          ) : (
            <>
              Watch <em>now</em>
            </>
          )
        }
      />

      {images.length > 0 ? (
        <div className="mt-12 md:mt-16">
          <h3 className={cn(META, "mb-5 text-fg-subtle")}>
            Photos <span className="text-fg-subtle">({images.length})</span>
          </h3>
          <ArtistGallery images={images} label={artistName} />
        </div>
      ) : null}

      {videos.length > 0 ? (
        <div className={images.length > 0 ? "mt-16 md:mt-20" : "mt-12 md:mt-16"}>
          <h3 className={cn(META, "mb-5 text-fg-subtle")}>
            Videos <span className="text-fg-subtle">({videos.length})</span>
          </h3>
          <ul className={cn("grid gap-8", videos.length > 1 && "md:grid-cols-2")}>
            {videos.map((video, i) => (
              <li key={`${video.url}-${i}`}>
                <Embed
                  url={video.url}
                  title={video.caption?.trim() || `${artistName} — video ${i + 1}`}
                  caption={video.caption?.trim() || undefined}
                />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </Section>
  );
}

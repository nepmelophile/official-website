import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { ThemeMenu } from "@/components/ui/ThemeToggle";
import { getBrandAssets } from "@/lib/queries/brand";
import { getNavLinks } from "@/lib/queries/nav";
import { getSiteChromeContactInfo } from "@/lib/queries/settings";
import { MobileNav } from "./MobileNav";
import { NavLinks } from "./NavLinks";
import { HEADER_CTA } from "./nav";
import { Wordmark } from "./Wordmark";

/**
 * Sticky public header: wordmark, main nav with active state, theme menu (lg+; below that it lives
 * in the mobile menu), CTA pill, mobile menu.
 */
export async function Header() {
  const [contact, links, brand] = await Promise.all([getSiteChromeContactInfo(), getNavLinks(), getBrandAssets()]);
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/80 backdrop-blur-md supports-[backdrop-filter]:bg-bg/70">
      <Container className="flex h-16 items-center justify-between gap-6 lg:h-[72px]">
        <Wordmark brand={brand} />
        {/* Up to seven links (with Trending and Testimonials) only fit beside the CTA from lg. */}
        <nav aria-label="Main" className="hidden lg:block">
          <NavLinks links={links} />
        </nav>
        <div className="flex items-center gap-3">
          <ThemeMenu className="hidden lg:block" />
          <ButtonLink href={HEADER_CTA.href} size="sm" icon="arrow-up-right" className="hidden md:inline-flex">
            {HEADER_CTA.label}
          </ButtonLink>
          <MobileNav links={links} socialLinks={contact.socialLinks} email={contact.email} />
        </div>
      </Container>
    </header>
  );
}

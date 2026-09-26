import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { getSiteChromeContactInfo } from "@/lib/queries/settings";
import { MobileNav } from "./MobileNav";
import { NavLinks } from "./NavLinks";
import { HEADER_CTA } from "./nav";
import { Wordmark } from "./Wordmark";

/** Sticky public header: wordmark, main nav with active state, CTA pill, mobile menu. */
export async function Header() {
  const contact = await getSiteChromeContactInfo();
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/80 backdrop-blur-md supports-[backdrop-filter]:bg-bg/70">
      <Container className="flex h-16 items-center justify-between gap-6 lg:h-[72px]">
        <Wordmark />
        <nav aria-label="Main" className="hidden md:block">
          <NavLinks />
        </nav>
        <div className="flex items-center gap-3">
          <ButtonLink href={HEADER_CTA.href} size="sm" icon="arrow-up-right" className="hidden md:inline-flex">
            {HEADER_CTA.label}
          </ButtonLink>
          <MobileNav socialLinks={contact.socialLinks} email={contact.email} />
        </div>
      </Container>
    </header>
  );
}

import { Logo } from "@/components/logo";
import { ButtonLink } from "@/components/ui/button";

export function SiteHeader({ signedIn }: { signedIn: boolean }) {
  return (
    <header className="border-b border-line/70">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-8 text-sm font-medium text-muted md:flex">
          <a href="#tests" className="transition hover:text-ink">
            Tests
          </a>
          <a href="#features" className="transition hover:text-ink">
            Features
          </a>
          <a href="#plans" className="transition hover:text-ink">
            Plans
          </a>
        </nav>
        <div className="flex items-center gap-2">
          {signedIn ? (
            <ButtonLink href="/dashboard" size="sm" variant="dark">
              Dashboard
            </ButtonLink>
          ) : (
            <>
              <ButtonLink href="/login" size="sm" variant="ghost" className="hidden sm:inline-flex">
                Sign in
              </ButtonLink>
              <ButtonLink href="/signup" size="sm" variant="dark">
                Get started
              </ButtonLink>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

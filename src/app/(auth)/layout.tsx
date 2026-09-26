import { Logo } from "@/components/logo";
import { SectionArt } from "@/components/section-art";
import { GUEST_DAILY_LIMIT, MEMBER_DAILY_LIMIT } from "@/lib/exam/constants";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.05fr]">
      <div className="flex flex-col px-5 py-6 sm:px-10">
        <Logo />
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm animate-fade-up">{children}</div>
        </div>
      </div>

      <aside className="relative hidden overflow-hidden bg-ink p-10 lg:flex lg:flex-col lg:justify-between">
        <div aria-hidden className="absolute -top-32 -right-24 size-[28rem] rounded-full bg-brand/40 blur-3xl" />
        <div aria-hidden className="absolute -bottom-40 -left-20 size-[26rem] rounded-full bg-english/25 blur-3xl" />

        <div className="relative grid grid-cols-2 gap-4">
          <SectionArt section="math" className="aspect-[16/11] rounded-3xl" />
          <SectionArt section="english" className="mt-10 aspect-[16/11] rounded-3xl" />
          <SectionArt section="general" className="-mt-6 aspect-[16/11] rounded-3xl" />
          <div className="mt-4 flex flex-col justify-center rounded-3xl bg-lime p-6">
            <p className="text-xs font-bold tracking-wide text-ink/60 uppercase">Daily tests</p>
            <p className="mt-1 text-4xl font-extrabold text-ink">
              {GUEST_DAILY_LIMIT} → {MEMBER_DAILY_LIMIT}
            </p>
            <p className="mt-1 text-sm text-ink/70">with a free account</p>
          </div>
        </div>

        <div className="relative">
          <p className="text-3xl leading-tight font-bold text-white">
            Every attempt saved.
            <br />
            <span className="text-white/50">Every point tracked.</span>
          </p>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/60">
            Your profile keeps each score, domain breakdown and question review, so you always know
            what to practice next.
          </p>
        </div>
      </aside>
    </div>
  );
}

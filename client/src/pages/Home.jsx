import {
  ArrowDownRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  CircleUserRound,
  Compass,
  HeartHandshake,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { Link } from "react-router-dom";

const pillars = [
  {
    number: "01",
    icon: UsersRound,
    title: "Find your people",
    description:
      "A more natural way to reconnect with the classmates, mentors, and friends who shaped your story.",
    accent: "coral",
  },
  {
    number: "02",
    icon: Compass,
    title: "Follow what is next",
    description:
      "A clear starting point for opportunities, ideas, and conversations that move your community forward.",
    accent: "ochre",
  },
  {
    number: "03",
    icon: HeartHandshake,
    title: "Give back with context",
    description:
      "Make the experience of one generation useful to the next — without losing the human part.",
    accent: "sage",
  },
];

const journey = [
  {
    label: "Where we started",
    value: "Shared history",
    detail:
      "The people and places that made the college feel like home.",
  },
  {
    label: "Where we are",
    value: "A living network",
    detail:
      "A welcoming foundation for every member of the community.",
  },
  {
    label: "Where we are going",
    value: "The next chapter",
    detail:
      "More ways to learn, contribute, and stay meaningfully connected.",
  },
];

export default function Home() {
  return (
    <main className="overflow-hidden bg-[hsl(var(--background))]">
      {/* HERO SECTION */}
      <section className="relative mx-auto grid max-w-[1240px] items-center gap-12 px-5 pb-20 pt-12 sm:px-8 sm:pt-20 lg:grid-cols-[1fr_0.8fr] lg:gap-10 lg:px-10 lg:pb-28 lg:pt-24">
        <div className="relative z-10">
          <div className="animate-rise-in mb-6 flex items-center gap-3">
            <span className="h-px w-8 bg-[hsl(var(--accent))]" />

            <span className="font-mono-display text-[10px] font-medium uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
              A new home for your college community
            </span>
          </div>

          <h1 className="animate-rise-in-delay-1 max-w-[720px] text-balance font-display text-[clamp(3.9rem,9vw,8.6rem)] leading-[0.84] tracking-[-0.055em] text-[hsl(var(--primary))]">
            Keep the
            <br />
            <em className="text-[hsl(var(--accent))]">good</em> going.
          </h1>

          <p className="animate-rise-in-delay-2 mt-8 max-w-[500px] text-[16px] leading-7 text-[hsl(var(--muted-foreground))] sm:text-[18px]">
            AlumniConnect is the living bridge between your college&apos;s
            shared history and its next chapter — welcoming alumni, useful to
            students, and built with care.
          </p>

          <div
            className="animate-rise-in-delay-3 mt-9 flex flex-wrap items-center gap-4"
            id="start"
          >
            <Link
              to="/register"
              className="group inline-flex items-center gap-3 rounded-full bg-[hsl(var(--primary))] px-5 py-3.5 text-[12px] font-bold uppercase tracking-[0.08em] text-[hsl(var(--primary-foreground))] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]"
            >
              Join the community

              <ArrowDownRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:translate-y-0.5" />
            </Link>

            <span className="font-mono-display text-[10px] uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">
              Phase 01 / Foundation
            </span>
          </div>
        </div>

        {/* HERO VISUAL */}
        <div className="relative min-h-[370px] sm:min-h-[470px]">
          <div className="absolute right-[-20vw] top-[-80px] h-[520px] w-[520px] rounded-full border border-[hsl(var(--border))] sm:right-[-70px] sm:top-[-60px] sm:h-[580px] sm:w-[580px]" />

          <div className="absolute right-[-10vw] top-[10px] h-[360px] w-[360px] rounded-full border border-dashed border-[hsl(var(--border))] sm:right-[10px] sm:top-[40px] sm:h-[410px] sm:w-[410px]" />

          {/* Dark Card */}
          <div className="animate-float-slow absolute left-[13%] top-[7%] z-10 h-[248px] w-[185px] rotate-[-5deg] rounded-[22px] bg-[hsl(var(--primary))] p-5 text-[hsl(var(--primary-foreground))] shadow-[var(--shadow-xl)] sm:left-[22%] sm:h-[304px] sm:w-[226px]">
            <div className="flex items-center justify-between">
              <span className="font-mono-display text-[9px] uppercase tracking-[0.15em] text-[hsl(var(--primary-foreground)/.6)]">
                Since 1984
              </span>

              <Sparkles className="h-4 w-4 text-[hsl(var(--accent))]" />
            </div>

            <div className="mt-14 font-display text-[29px] leading-[.88] tracking-[-.04em] sm:mt-20 sm:text-[37px]">
              The
              <br />
              <em className="text-[hsl(var(--accent))]">threads</em>
              <br />
              continue.
            </div>

            <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between border-t border-[hsl(var(--primary-foreground)/.18)] pt-3">
              <span className="text-[9px] leading-3 text-[hsl(var(--primary-foreground)/.6)]">
                One community.
                <br />
                Many chapters.
              </span>

              <ArrowUpRight className="h-4 w-4 text-[hsl(var(--accent))]" />
            </div>
          </div>

          {/* Community Card */}
          <div className="absolute bottom-[11%] right-[5%] z-20 w-[196px] rotate-[8deg] rounded-[18px] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 shadow-[var(--shadow-md)] sm:right-[7%] sm:w-[240px]">
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-[hsl(var(--secondary))]">
                <CircleUserRound className="h-4 w-4 text-[hsl(var(--primary))]" />
              </span>

              <div>
                <p className="text-[10px] font-bold">
                  Your community
                </p>

                <p className="font-mono-display text-[8px] text-[hsl(var(--muted-foreground))]">
                  always in motion
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center">
              <span className="grid h-8 w-8 place-items-center rounded-full border-2 border-[hsl(var(--card))] bg-[#df987b] text-[9px] font-bold text-[hsl(var(--primary))]">
                AM
              </span>

              <span className="-ml-2 grid h-8 w-8 place-items-center rounded-full border-2 border-[hsl(var(--card))] bg-[#d4b56c] text-[9px] font-bold text-[hsl(var(--primary))]">
                JP
              </span>

              <span className="-ml-2 grid h-8 w-8 place-items-center rounded-full border-2 border-[hsl(var(--card))] bg-[#9eb8a8] text-[9px] font-bold text-[hsl(var(--primary))]">
                RK
              </span>

              <span className="ml-2 text-[10px] text-[hsl(var(--muted-foreground))]">
                and your next hello
              </span>
            </div>
          </div>

          {/* Decorative Square */}
          <div className="absolute bottom-[7%] left-[2%] h-16 w-16 rounded-[19px] bg-[hsl(var(--accent))] sm:bottom-[9%] sm:left-[6%]" />

          {/* Decorative Circle */}
          <div className="absolute right-[8%] top-[4%] grid h-11 w-11 place-items-center rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--background))]">
            <span className="h-2 w-2 animate-pulse-soft rounded-full bg-[hsl(var(--accent))]" />
          </div>
        </div>
      </section>

      {/* IDEA SECTION */}
      <section
        id="why"
        className="border-y border-[hsl(var(--border))] bg-[hsl(var(--secondary)/.45)]"
      >
        <div className="mx-auto max-w-[1240px] px-5 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24">
          <div className="grid gap-10 lg:grid-cols-[.55fr_1fr] lg:gap-20">
            <div>
              <span className="font-mono-display text-[10px] font-medium uppercase tracking-[0.18em] text-[hsl(var(--accent))]">
                01 / The idea
              </span>

              <h2 className="mt-5 max-w-[340px] font-display text-[clamp(2.8rem,5vw,4.8rem)] leading-[.9] tracking-[-.045em]">
                Connection should feel <em>close.</em>
              </h2>
            </div>

            <div className="max-w-[630px] pt-1">
              <p className="text-[19px] leading-8 tracking-[-.02em] text-[hsl(var(--foreground))] sm:text-[22px]">
                The best college communities do not end at graduation. They
                keep making room — for a question, an introduction, a new
                point of view.
              </p>

              <p className="mt-5 max-w-[520px] text-[14px] leading-6 text-[hsl(var(--muted-foreground))]">
                AlumniConnect gives that feeling a place to live. This first
                foundation is intentionally simple: a clear invitation to
                reconnect, with a thoughtful product ready to grow around it.
              </p>
            </div>
          </div>

          {/* PILLARS */}
          <div className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--border))] md:grid-cols-3">
            {pillars.map((pillar) => {
              const Icon = pillar.icon;

              const accentClass =
                pillar.accent === "coral"
                  ? "bg-[hsl(var(--accent))]"
                  : pillar.accent === "ochre"
                  ? "bg-[#d4b56c]"
                  : "bg-[#9eb8a8]";

              return (
                <article
                  key={pillar.number}
                  className="group bg-[hsl(var(--card))] p-6 transition-colors duration-300 hover:bg-[hsl(var(--background))] sm:p-8"
                >
                  <div className="flex items-start justify-between">
                    <span
                      className={`grid h-10 w-10 place-items-center rounded-xl ${accentClass}`}
                    >
                      <Icon className="h-[18px] w-[18px] text-[hsl(var(--primary))]" />
                    </span>

                    <span className="font-mono-display text-[10px] text-[hsl(var(--muted-foreground))]">
                      {pillar.number}
                    </span>
                  </div>

                  <h3 className="mt-16 text-[17px] font-bold tracking-[-.03em]">
                    {pillar.title}
                  </h3>

                  <p className="mt-3 text-[13px] leading-6 text-[hsl(var(--muted-foreground))]">
                    {pillar.description}
                  </p>

                  <div className="mt-7 h-px w-0 bg-[hsl(var(--accent))] transition-all duration-500 group-hover:w-12" />
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ROADMAP */}
      <section
        id="roadmap"
        className="mx-auto max-w-[1240px] px-5 py-16 sm:px-8 sm:py-24 lg:px-10"
      >
        <div className="flex flex-col justify-between gap-7 md:flex-row md:items-end">
          <div>
            <span className="font-mono-display text-[10px] font-medium uppercase tracking-[0.18em] text-[hsl(var(--accent))]">
              02 / A steady start
            </span>

            <h2 className="mt-5 max-w-[590px] font-display text-[clamp(2.8rem,6vw,5.9rem)] leading-[.86] tracking-[-.05em]">
              Built for the
              <br />
              <em>long view.</em>
            </h2>
          </div>

          <p className="max-w-[290px] text-[13px] leading-6 text-[hsl(var(--muted-foreground))]">
            The product will grow in thoughtful chapters. The foundation comes
            first — clear, trustworthy, and ready for the people who make a
            community.
          </p>
        </div>

        {/* JOURNEY */}
        <div className="relative mt-16 border-l border-[hsl(var(--border))] pl-6 sm:ml-[14%] sm:pl-12">
          <div className="absolute -left-[4px] top-0 h-2 w-2 rounded-full bg-[hsl(var(--accent))]" />

          {journey.map((item, index) => (
            <div
              key={item.label}
              className="relative pb-12 last:pb-0 sm:pb-16"
            >
              <div className="absolute -left-[31px] top-0 h-[9px] w-[9px] rounded-full border-2 border-[hsl(var(--background))] bg-[hsl(var(--border))] sm:-left-[53px]" />

              <div className="grid gap-3 sm:grid-cols-[180px_1fr] sm:gap-10">
                <span className="font-mono-display text-[10px] uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">
                  {item.label}
                </span>

                <div>
                  <h3 className="font-display text-[30px] leading-none tracking-[-.035em] sm:text-[38px]">
                    {item.value}
                  </h3>

                  <p className="mt-3 max-w-[420px] text-[13px] leading-6 text-[hsl(var(--muted-foreground))]">
                    {item.detail}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-5 mb-8 overflow-hidden rounded-[24px] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] sm:mx-8 lg:mx-auto lg:max-w-[1200px]">
        <div className="relative grid gap-10 px-7 py-12 sm:px-12 sm:py-16 lg:grid-cols-[1fr_auto] lg:items-center lg:px-16">
          <div className="absolute right-[-40px] top-[-100px] h-[260px] w-[260px] rounded-full border border-[hsl(var(--primary-foreground)/.14)]" />

          <div className="absolute right-[80px] top-[-30px] h-[120px] w-[120px] rounded-full border border-dashed border-[hsl(var(--primary-foreground)/.14)]" />

          <div className="relative z-10">
            <span className="font-mono-display text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--accent))]">
              A place to begin
            </span>

            <h2 className="mt-5 max-w-[610px] font-display text-[clamp(2.8rem,5vw,5rem)] leading-[.88] tracking-[-.05em]">
              Your next hello
              <br />
              <em>starts here.</em>
            </h2>

            <p className="mt-5 max-w-[430px] text-[14px] leading-6 text-[hsl(var(--primary-foreground)/.66)]">
              AlumniConnect is in its first chapter. Come back soon as we open
              the doors to more of the community.
            </p>
          </div>

          <div className="relative z-10">
            <Link
              to="/register"
              className="group inline-flex items-center gap-3 rounded-full bg-[hsl(var(--accent))] px-5 py-3.5 text-[12px] font-bold uppercase tracking-[0.08em] text-[hsl(var(--primary))] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_28px_hsl(var(--accent)/.18)]"
            >
              Begin your chapter

              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* SMALL BOTTOM STATUS */}
      <div className="mx-auto flex max-w-[1240px] flex-col gap-4 px-5 pb-8 pt-4 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
        <span className="font-mono-display text-[9px] uppercase tracking-[0.13em] text-[hsl(var(--muted-foreground))]">
          AlumniConnect / Phase 01
        </span>

        <div className="flex items-center gap-4 text-[11px] text-[hsl(var(--muted-foreground))]">
          <span className="inline-flex items-center gap-2">
            <Check className="h-3.5 w-3.5 text-[hsl(var(--accent))]" />
            Foundation ready
          </span>

          <Link
            to="/status"
            className="transition-colors hover:text-[hsl(var(--foreground))]"
          >
            Status
          </Link>
        </div>
      </div>
    </main>
  );
}


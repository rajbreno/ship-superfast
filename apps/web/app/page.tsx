"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";

import { useIsMobile } from "@/hooks/use-mobile";
import { useSession } from "@/components/providers/session-provider";
import { ModeToggle } from "@/components/navigation/mode-toggle";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  useCarousel,
} from "@/components/ui/carousel";
import CircularText from "@/components/landing/CircularText";
import { Navbar } from "@/components/navigation/navbar";
import {
  FingerPrintIcon,
  CloudUploadIcon,
  CreditCardIcon,
  Mail01Icon,
  AiChat02Icon,
  Notification01Icon,
  ArrowRight01Icon,
  SmartPhone01Icon,
  BrowserIcon,
  Copy01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";

const EXPO_PROJECT_ID = "37103778-bef9-4f12-b132-b84a65630ace";
const EXPO_UPDATE_GROUP_ID = "76380cdd-8969-4bc0-a1cf-9e7e7825ac46";
const EXPO_PREVIEW_URL = `https://expo.dev/preview/update?projectId=${EXPO_PROJECT_ID}&group=${EXPO_UPDATE_GROUP_ID}`;
const EXPO_QR_URL = `https://qr.expo.dev/eas-update?projectId=${EXPO_PROJECT_ID}&groupId=${EXPO_UPDATE_GROUP_ID}`;


export default function LandingPage() {
  const { isSignedIn, isLoading } = useSession();
  const router = useRouter();
  useEffect(() => {
    if (isSignedIn) {
      router.replace("/dashboard");
    }
  }, [isSignedIn, router]);

  if (isLoading || isSignedIn) {
    return null;
  }

  const ctaHref = isSignedIn ? "/dashboard" : "/sign-in";

  return (
    <div className="flex min-h-svh flex-col">
      <Navbar />

      {/* ── Hero ── */}
      <section className="mx-auto flex w-full max-w-6xl flex-col items-center px-6 pt-28 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center"
        >
          <CircularText
            text="CONVEX · BOILERPLATE · "
            spinDuration={15}
            onHover="speedUp"
            className="!w-[120px] !h-[120px] !text-foreground !text-sm sm:!w-[140px] sm:!h-[140px]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/stack-logos/convex-icon-logo.png"
              alt="Convex"
              className="h-10 w-10 sm:h-12 sm:w-12"
            />
          </CircularText>
          <h1 className="mt-8 max-w-4xl text-center font-[family-name:var(--font-instrument-serif)] text-5xl italic tracking-tight text-primary sm:text-6xl lg:text-7xl xl:text-8xl">
            Ship Superfast
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mt-6 max-w-2xl text-center text-lg text-foreground/70"
        >
          A <span className="font-medium">monorepo</span> starter kit for web and mobile apps.
          Convex, Next.js, and Expo with auth, payments, storage, and AI all wired up.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 flex items-center gap-4"
        >
          <Button asChild size="lg">
            <Link href={ctaHref}>
              Try Web Demo
              <HugeiconsIcon icon={ArrowRight01Icon} />
            </Link>
          </Button>
          <TryAppButton />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="mt-16 w-full overflow-hidden rounded-2xl border bg-card"
        >
          <div className="grid grid-cols-2 divide-x divide-y sm:grid-cols-4 sm:divide-y-0">
            <div className="flex flex-col items-center gap-1 py-8">
              <span className="text-2xl font-bold sm:text-3xl">0 → Prod</span>
              <span className="text-sm text-muted-foreground">Superfast</span>
            </div>
            <div className="flex flex-col items-center gap-2 py-8">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/web.png" alt="Web" className="h-10 w-10 object-contain" />
              <span className="text-sm text-muted-foreground">Web</span>
            </div>
            <div className="flex flex-col items-center gap-2 py-8">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/appstore.png" alt="App Store" className="h-10 w-10 rounded-lg object-contain" />
              <span className="text-sm text-muted-foreground">iOS</span>
            </div>
            <div className="flex flex-col items-center gap-2 py-8">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/playstore.png" alt="Play Store" className="h-10 w-10 rounded-lg object-contain" />
              <span className="text-sm text-muted-foreground">Android</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── Platform Mockups Carousel ── */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="mx-auto w-full max-w-6xl px-6 py-24"
      >
        <Carousel opts={{ align: "start", loop: true }}>
          <CarouselContent>
            {[
              { src: "/platform-mocks/d1.jpeg", alt: "Web sign-in page" },
              { src: "/platform-mocks/d2.jpeg", alt: "Web dashboard" },
              { src: "/platform-mocks/d3.jpeg", alt: "Web billing" },
              { src: "/platform-mocks/d4.jpeg", alt: "Web team management" },
              { src: "/platform-mocks/d5.jpeg", alt: "Web profile" },
              { src: "/platform-mocks/m1.jpeg", alt: "Mobile onboarding and sign-in" },
              { src: "/platform-mocks/m2.jpeg", alt: "Mobile dashboard and billing" },
            ].map((mock) => (
              <CarouselItem key={mock.src}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={mock.src}
                  alt={mock.alt}
                  className="w-full rounded-2xl border border-border/50 object-cover"
                  loading="lazy"
                />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
          <CarouselDots />
        </Carousel>
      </motion.section>

      {/* ── Stack Bento ── */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="mx-auto w-full max-w-6xl px-6 py-24"
      >
        <div className="mb-14 text-center">
          <h2 className="text-4xl font-semibold tracking-tight">The Stack</h2>
          <p className="mt-3 text-lg text-muted-foreground">
            Every technology in the kit and what it powers.
          </p>
        </div>

        {/* Border-divided bento */}
        <div className="overflow-hidden rounded-3xl border bg-card">
          {/* Row 1 — Core big three */}
          <div className="grid grid-cols-1 divide-x-0 divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <BentoTech tech={allTech[0]} tall />
            <BentoTech tech={allTech[1]} tall />
            <BentoTech tech={allTech[2]} tall />
          </div>

          {/* Row 2 — Core + AI */}
          <div className="grid grid-cols-1 divide-x-0 divide-y border-t sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <BentoTech tech={allTech[3]} />
            <BentoTech tech={allTech[4]} />
            <BentoTech tech={allTech[5]} />
          </div>

          {/* Row 3 — UI layer */}
          <div className="grid grid-cols-1 divide-x-0 divide-y border-t sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <BentoTech tech={allTech[6]} />
            <BentoTech tech={allTech[7]} />
            <BentoTech tech={allTech[8]} />
          </div>

          {/* Row 4 — Integrations */}
          <div className="grid grid-cols-1 divide-x-0 divide-y border-t sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <BentoTech tech={allTech[9]} />
            <BentoTech tech={allTech[10]} />
            <BentoTech tech={allTech[11]} />
          </div>
        </div>
      </motion.section>

      {/* ── Platforms ── */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="mx-auto w-full max-w-6xl px-6 py-24"
      >
        <div className="mb-14 text-center">
          <h2 className="text-4xl font-semibold tracking-tight">
            One codebase, two platforms
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">
            Ship a web app and a mobile app from the same project.
          </p>
        </div>

        <div className="overflow-hidden rounded-3xl border bg-card">
          <div className="grid grid-cols-1 divide-x-0 divide-y sm:grid-cols-2 sm:divide-x sm:divide-y-0">
            {/* Web */}
            <div className="flex flex-col gap-5 p-10 sm:p-14 transition-colors duration-200 hover:bg-muted/50">
              <HugeiconsIcon icon={BrowserIcon} strokeWidth={1} className="h-12 w-12 text-primary" />
              <div>
                <p className="text-xl font-semibold">Web App</p>
                <p className="mt-2 text-base leading-relaxed text-muted-foreground">
                  Next.js 16 with shadcn/ui and Tailwind v4. Server components, app router, and dark mode out of the box.
                </p>
              </div>
            </div>

            {/* Mobile */}
            <div className="flex flex-col gap-5 p-10 sm:p-14 transition-colors duration-200 hover:bg-muted/50">
              <HugeiconsIcon icon={SmartPhone01Icon} strokeWidth={1} className="h-12 w-12 text-primary" />
              <div>
                <p className="text-xl font-semibold">Mobile App</p>
                <p className="mt-2 text-base leading-relaxed text-muted-foreground">
                  Expo 54 with HeroUI Native and Uniwind. iOS and Android from a single codebase with native performance.
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ── Features ── */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="mx-auto w-full max-w-6xl px-6 py-24"
      >
        <div className="mb-14 text-center">
          <h2 className="text-4xl font-semibold tracking-tight">
            Everything you need
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">
            Six production integrations, all wired up and ready to go.
          </p>
        </div>

        <div className="overflow-hidden rounded-3xl border bg-card">
          {/* Row 1 */}
          <div className="grid grid-cols-1 divide-x-0 divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <BentoFeature f={features[0]} />
            <BentoFeature f={features[1]} />
            <BentoFeature f={features[2]} />
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-1 divide-x-0 divide-y border-t sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <BentoFeature f={features[3]} />
            <BentoFeature f={features[4]} />
            <BentoFeature f={features[5]} />
          </div>
        </div>
      </motion.section>

      {/* ── CTA ── */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 py-20 text-center"
      >
        <h2 className="text-3xl font-semibold">Ready to ship?</h2>
        <p className="max-w-md text-lg text-muted-foreground">
          Start building your web and mobile app today.
        </p>
        <div className="flex items-center gap-4">
          <Button asChild size="lg">
            <Link href={ctaHref}>
              Try Web Demo
              <HugeiconsIcon icon={ArrowRight01Icon} />
            </Link>
          </Button>
          <TryAppButton />
        </div>
      </motion.section>

      {/* ── Footer ── */}
      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 text-sm text-muted-foreground">
          <a href="https://rajbreno.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/rajbreno.png" alt="Raj Breno" className="h-6 w-6 rounded-full object-cover" />
            <span>Made by <span className="underline underline-offset-2">Raj Breno</span></span>
          </a>
          <ModeToggle />
        </div>
      </footer>
    </div>
  );
}

// ── Bento cells ────────────────────────────────────────────────────

type TechItem = {
  name: string;
  logo: string;
  purpose: string;
  category: string;
};

function BentoTech({
  tech,
  tall,
}: {
  tech: TechItem;
  tall?: boolean;
}) {
  return (
    <div
      className={`group flex items-center gap-6 transition-colors duration-200 hover:bg-muted/50 ${tall ? "py-16" : "py-12"} px-10`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={tech.logo}
        alt={tech.name}
        className="h-14 w-14 shrink-0 rounded-lg object-contain transition-transform duration-300 group-hover:scale-110 dark:h-12 dark:w-12"
        loading="lazy"
      />
      <div>
        <p className="text-lg font-semibold">{tech.name}</p>
        <p className="mt-0.5 text-base text-muted-foreground">{tech.purpose}</p>
      </div>
    </div>
  );
}

type Feature = (typeof features)[number];

function BentoFeature({
  f,
  tall,
}: {
  f: Feature;
  tall?: boolean;
}) {
  return (
    <div
      className={`group flex flex-col gap-4 transition-colors duration-200 hover:bg-muted/50 ${tall ? "p-10 sm:p-12" : "p-8 sm:p-10"}`}
    >
      <HugeiconsIcon
        icon={f.icon}
        strokeWidth={1}
        className="h-10 w-10 text-primary"
      />
      <div>
        <p className={`font-semibold ${tall ? "text-xl" : "text-lg"}`}>
          {f.title}
        </p>
        <p className="mt-2 text-base leading-relaxed text-muted-foreground">
          {f.description}
        </p>
      </div>
    </div>
  );
}

// ── Carousel Dots ─────────────────────────────────────────────────

function CarouselDots() {
  const { api } = useCarousel();
  const [selected, setSelected] = useState(0);
  const [count, setCount] = useState(0);

  const onSelect = useCallback(() => {
    if (!api) return;
    setSelected(api.selectedScrollSnap());
  }, [api]);

  useEffect(() => {
    if (!api) return;
    const snapCount = api.scrollSnapList().length;
    const snapSelected = api.selectedScrollSnap();
    queueMicrotask(() => {
      setCount(snapCount);
      setSelected(snapSelected);
    });
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api, onSelect]);

  if (count <= 1) return null;

  return (
    <div className="mt-4 flex items-center justify-center gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <button
          key={i}
          aria-label={`Go to slide ${i + 1}`}
          onClick={() => api?.scrollTo(i)}
          className="relative flex items-center justify-center p-1"
        >
          <motion.div
            className="rounded-full bg-muted-foreground/30"
            animate={{
              width: i === selected ? 24 : 8,
              height: 8,
              backgroundColor: i === selected ? "var(--color-primary)" : undefined,
              opacity: i === selected ? 1 : 0.4,
            }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          />
        </button>
      ))}
    </div>
  );
}

// ── Try App (Responsive Dialog / Drawer) ──────────────────────────

function TryAppButton() {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <Button variant="outline" size="lg">
            <HugeiconsIcon icon={SmartPhone01Icon} />
            Try App
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Preview on your phone</DrawerTitle>
            <DrawerDescription>
              Scan the QR code with Expo Go or copy the link below.
            </DrawerDescription>
          </DrawerHeader>
          <QRContent />
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline">Close</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="lg">
          <HugeiconsIcon icon={SmartPhone01Icon} />
          Try App
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Preview on your phone</DialogTitle>
          <DialogDescription>
            Scan the QR code with Expo Go or copy the link below.
          </DialogDescription>
        </DialogHeader>
        <QRContent />
      </DialogContent>
    </Dialog>
  );
}

function QRContent() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(EXPO_PREVIEW_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center gap-6 px-4 py-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={EXPO_QR_URL}
        alt="Scan to preview in Expo Go"
        className="h-[180px] w-[180px] rounded-lg bg-white p-2"
      />
      <div className="flex w-full items-center gap-2">
        <Input value={EXPO_PREVIEW_URL} readOnly />
        <Button variant="outline" size="icon" onClick={handleCopy}>
          <HugeiconsIcon icon={copied ? Tick02Icon : Copy01Icon} />
        </Button>
      </div>
    </div>
  );
}

// ── Data ───────────────────────────────────────────────────────────

const allTech: TechItem[] = [
  { name: "Convex", logo: "/stack-logos/convex.png", purpose: "Realtime Backend", category: "Core" },
  { name: "Next.js 16", logo: "/stack-logos/next.png", purpose: "Web Framework", category: "Core" },
  { name: "Expo 54", logo: "/stack-logos/expo.png", purpose: "Mobile Framework", category: "Core" },
  { name: "Turborepo", logo: "/stack-logos/turbo.png", purpose: "Monorepo Build", category: "Core" },
  { name: "TypeScript", logo: "/stack-logos/type.png", purpose: "Type Safety", category: "Core" },
  { name: "AI Agent Toolkit", logo: "/stack-logos/convex.png", purpose: "Powered by Vercel AI SDK", category: "Integration" },
  { name: "shadcn/ui", logo: "/stack-logos/shadcn.png", purpose: "Web Components", category: "UI" },
  { name: "HeroUI Native", logo: "/stack-logos/herouinative.png", purpose: "Mobile Components", category: "UI" },
  { name: "Tailwind v4", logo: "/stack-logos/tailwind.png", purpose: "Styling", category: "UI" },
  { name: "Cloudflare R2", logo: "/stack-logos/cloudflare.png", purpose: "File Storage", category: "Integration" },
  { name: "Dodo Payments", logo: "/stack-logos/dodo.png", purpose: "Payments", category: "Integration" },
  { name: "Resend", logo: "/stack-logos/resend.png", purpose: "Email", category: "Integration" },
];

const features = [
  {
    title: "Authentication",
    description:
      "Google OAuth and magic link on web and mobile with role-based access.",
    icon: FingerPrintIcon,
  },
  {
    title: "File Storage",
    description:
      "Upload files with signed URLs and global edge delivery via R2.",
    icon: CloudUploadIcon,
  },
  {
    title: "Payments",
    description:
      "Checkout, subscriptions, and customer portal via Dodo Payments.",
    icon: CreditCardIcon,
  },
  {
    title: "Email",
    description:
      "Transactional emails via Resend with delivery guarantees.",
    icon: Mail01Icon,
  },
  {
    title: "AI Agents",
    description:
      "AI agents with tool calling, RAG, and real-time streaming.",
    icon: AiChat02Icon,
  },
  {
    title: "Push Notifications",
    description:
      "Native push for iOS and Android with user targeting and broadcast.",
    icon: Notification01Icon,
  },
];

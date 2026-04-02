import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:justify-between sm:px-6">
        <a
          href="https://rajbreno.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/rajbreno.png"
            alt="Raj Breno"
            className="h-6 w-6 rounded-full object-cover"
          />
          <span>
            Made by{" "}
            <span className="underline underline-offset-2">Raj Breno</span>
          </span>
        </a>
        <div className="flex items-center gap-4">
          <Link href="/privacy" className="hover:underline">
            Privacy
          </Link>
          <Link href="/terms" className="hover:underline">
            Terms
          </Link>
        </div>
      </div>
    </footer>
  );
}

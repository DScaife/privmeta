import Link from "next/link";

const Footer = () => {
  return (
    <footer className="flex justify-center w-full border-t border-[var(--border)]">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-2 w-full max-w-[var(--max-content-width)] px-[var(--space-xl)] py-4 sm:h-14">
        <p className="text-xs sm:text-sm text-muted-foreground">
          Built for privacy. Source code on{" "}
          <a className="underline" href="https://github.com/DScaife/privmeta/tree/master" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
          .
        </p>
        <nav className="flex items-center gap-4 text-xs sm:text-sm text-muted-foreground">
          <Link href="/" className="hover:underline">
            Home
          </Link>
          <Link href="/how-it-works" className="hover:underline">
            How It Works
          </Link>
          <Link href="/blog" className="hover:underline">
            Blog
          </Link>
        </nav>
      </div>
    </footer>
  );
};

export default Footer;

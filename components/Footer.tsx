"use client";

const Footer = () => {
  return (
    <footer className="flex justify-center w-full border-t border-[var(--border)]">
      <div className="flex justify-between items-center w-full max-w-[var(--max-content-width)] px-[var(--space-xl)] h-14">
        <p className="text-xs sm:text-base">
          Built for privacy. The source code is available on{" "}
          <a className="underline" href="https://github.com/DScaife/privmeta/tree/master" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
          .
        </p>
      </div>
    </footer>
  );
};

export default Footer;

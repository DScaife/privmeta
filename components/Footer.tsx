const Footer = () => {
  return (
    <footer className="flex items-center h-40">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-2 w-full py-4 sm:h-14">
        <p className="text-base">
          Built for privacy. Source code on{" "}
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

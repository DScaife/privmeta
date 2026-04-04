import Typography from "./Typography";

const Footer = () => {
  return (
    <footer className="flex items-center xl:py-(--space-3xl) pt-(--space-2xl) pb-(--space-lg)">
      <div className="w-full flex flex-col gap-(--space-lg) sm:flex-row sm:justify-between sm:items-end">
        <Typography variant="footer" muted>
          Built for everyday digital hygiene.
        </Typography>

        <a
          className="underline underline-offset-4 type-fluid type-footer"
          href="https://github.com/DScaife/privmeta/tree/master"
          target="_blank"
          rel="noopener noreferrer"
        >
          View source on GitHub
        </a>
      </div>
    </footer>
  );
};

export default Footer;

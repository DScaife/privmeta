import { Badge } from "./ui/badge";
import { Lock, CodeXml, Globe } from "lucide-react";

const Hero = () => {
  return (
    <div className="flex flex-col gap-[var(--space-lg)] w-full">
      <div className="flex gap-[var(--space-lg)] items-center sm:text-start">
        <h1 className="text-2xl sm:text-4xl font-bold">Remove metadata privately</h1>
        <Lock size={28} strokeWidth={3} className="hidden sm:inline" />
      </div>
      <div className="text-lg text-muted-foreground">
        <h2 className="hidden sm:block">Clean hidden metadata from your files, right in your browser.</h2>
        <h2 className="hidden sm:block">No uploads. No tracking. Open source. Private by design.</h2>
        <h2 className="sm:hidden">Clean your files of hidden metadata.</h2>
        <h2 className="sm:hidden">No uploads. No tracking. Open source.</h2>
      </div>
      <div className="flex gap-[var(--space-lg)]">
        <Badge variant="secondary" className="text-sm md:text-base">
          Private <Lock />
        </Badge>
        <Badge variant="secondary" className="text-sm md:text-base">
          Open source <CodeXml />
        </Badge>
        <Badge variant="secondary" className="text-sm md:text-base">
          Works offline <Globe />
        </Badge>
      </div>
    </div>
  );
};

export default Hero;

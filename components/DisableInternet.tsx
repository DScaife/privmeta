import { Skeleton } from "./ui/skeleton";
import { WifiOff } from "lucide-react";

const DisableInternet = ({ loading }: { loading: boolean }) => {
  return (
    <>
      {loading ? (
        <div className="flex w-full gap-[var(--space-lg)] items-center bg-[var(--accent-secondary)] p-[var(--space-lg)] rounded-md">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex flex-col gap-2 w-full">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      ) : (
        <div className="relative flex w-full gap-[var(--space-lg)] items-center border-[var(--foreground)] border-1 p-[var(--space-lg)] sm:p-[var(--space-xl)] rounded-md">
          <div className="flex flex-col gap-[var(--space-sm)] w-full">
            <h3 className="font-semibold">If you are reading this...</h3>
            <p className="text-sm md:text-base text-muted-foreground pr-[100px]">
              You can safely disable your internet — all files are processed in-browser and never touch a server.
            </p>
          </div>
          <div className="absolute bg-muted flex justify-center items-center right-0 border-l-1 border-foreground rounded-r-md h-full w-24">
            <WifiOff size={32} />
          </div>
        </div>
      )}
    </>
  );
};

export default DisableInternet;

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
        <div className="flex w-full gap-[var(--space-lg)] items-center bg-[var(--foreground)] text-[var(--background)] p-[var(--space-lg)] rounded-md">
          <WifiOff size={32} strokeWidth={2} className="hidden sm:block" />
          <div>
            <h3 className="font-bold">If you are reading this...</h3>
            <p className="text-sm text-muted-foreground">
              You can safely disable your internet — all files are processed in-browser and never touch a server.
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default DisableInternet;

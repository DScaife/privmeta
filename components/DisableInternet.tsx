import { Skeleton } from "./ui/skeleton";

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
        <div className="flex w-full gap-[var(--space-lg)] items-center border-[var(--foreground)] border-1 p-[var(--space-xl)] rounded-md">
          <div className="flex flex-col gap-[var(--space-sm)]">
            <h3 className="font-semibold">If you are reading this...</h3>
            <p className="text-sm md:text-base text-muted-foreground">
              You can safely disable your internet — all files are processed in-browser and never touch a server.
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default DisableInternet;

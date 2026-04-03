import { Skeleton } from "./ui/skeleton";
import { Sparkles } from "lucide-react";

const DisableInternet = ({ loading }: { loading: boolean }) => {
  return (
    <>
      {loading ? (
        <div className="flex w-full gap-(--space-lg) items-center bg-(--accent-secondary) p-(--space-lg) rounded-md">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex flex-col gap-2 w-full">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      ) : (
        <div className="relative flex w-full gap-(--space-lg) items-center border-(--foreground) border-1 p-(--space-lg) sm:p-(--space-xl) rounded-md">
          <div className="flex flex-col gap-(--space-sm) w-full pr-[100px]">
            <h3 className="font-semibold">If you are reading this...</h3>
            <p className="text-sm md:text-base text-muted-foreground">
              You can safely disable your internet — all files are processed in-browser and never touch a server.
            </p>
          </div>
          <div className="absolute bg-muted/70 flex justify-center items-center right-0 border-l-1 border-foreground rounded-r-md h-full w-24">
            <Sparkles size={32} strokeWidth={1.5}/>
          </div>
        </div>
      )}
    </>
  );
};

export default DisableInternet;

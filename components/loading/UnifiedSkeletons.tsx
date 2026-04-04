import { Skeleton } from "@/components/ui/skeleton";

export const HeroSkeleton = () => (
  <section className="w-full">
    <Skeleton className="h-16 w-full max-w-4xl" />
  </section>
);

export const DropzoneSkeleton = () => (
  <div className="w-full">
    <div className="relative flex flex-col items-center justify-center w-full min-h-96 gap-(--space-md) border-3 border-dashed p-(--space-2xl) rounded-xl border-muted-foreground/50">
      <Skeleton className="h-16 w-16 rounded-md" />
      <Skeleton className="h-6 w-64" />
      <Skeleton className="h-6 w-72" />
      <div className="absolute right-(--space-xl) bottom-(--space-md)">
        <Skeleton className="h-4 w-10" />
      </div>
    </div>
  </div>
);

export const InlineActionsSkeleton = () => (
  <div className="w-full flex justify-end gap-(--space-md)">
    <Skeleton className="h-10 w-40" />
    <Skeleton className="h-10 w-48" />
  </div>
);

export const DisableInternetSkeleton = () => (
  <section className="w-full">
    <Skeleton className="h-8 w-full max-w-3xl" />
  </section>
);

export const ShareFunctionsSkeleton = () => (
  <div className="w-full flex flex-col gap-(--space-2xl)">
    <div className="flex flex-col sm:flex-row sm:items-center gap-6">
      <Skeleton className="h-5 w-32" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-(--space-md)">
        <Skeleton className="h-10 w-28" />
        <Skeleton className="h-10 w-28" />
        <Skeleton className="h-10 w-28" />
        <Skeleton className="h-10 w-28" />
      </div>
    </div>
    <div className="flex flex-col sm:flex-row sm:items-center gap-6">
      <Skeleton className="h-5 w-24" />
      <Skeleton className="h-10 w-44" />
    </div>
    <div className="flex flex-col sm:flex-row sm:items-center gap-6">
      <Skeleton className="h-5 w-28" />
      <Skeleton className="h-10 w-full sm:w-96" />
    </div>
    <div className="flex flex-col sm:flex-row sm:items-center gap-6">
      <Skeleton className="h-5 w-36" />
      <Skeleton className="h-10 w-48" />
    </div>
  </div>
);

"use client";
import { Button } from "@/components/ui/button";
import Dropzone from "@/components/Dropzone";
import { useState, useEffect } from "react";
import {
  stripImageMetadata,
  stripPdfMetadata,
  stripDocxMetadata,
  stripVideoMetadata,
  stripAudioMetadata,
  stripJpegMetadata,
} from "@/utils/stripMetadata";
import { MAX_FILE_COUNT, MAX_FILE_SIZE_MB } from "@/utils/constants";
import { getFileExtensions } from "@/utils/utils";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import JSZip from "jszip";
import ClearAllButton from "@/components/ClearAllButton";
import ShareFunctions from "@/components/ShareFunctions";
import Hero from "@/components/Hero";
import DisableInternet from "@/components/DisableInternet";
import {
  HeroSkeleton,
  DropzoneSkeleton,
  InlineActionsSkeleton,
  DisableInternetSkeleton,
  ShareFunctionsSkeleton,
} from "@/components/loading/UnifiedSkeletons";

type ErrorType = "file_count" | "unsupported_format" | "file_too_large" | "general" | "dropzone_error";

const renameWithSuffix = (file: File, suffix = "_cleaned"): string => {
  const nameParts = file.name.split(".");
  if (nameParts.length < 2) return `${file.name}${suffix}`;
  const ext = nameParts.pop();
  const base = nameParts.join(".");
  return `${base}${suffix}.${ext}`;
};

const showErrorToast = (type: ErrorType) => {
  const warnings: ErrorType[] = ["file_count", "unsupported_format", "file_too_large", "general", "dropzone_error"];

  const messages = {
    file_count: {
      title: "Too many files",
      description: `You can only upload up to ${MAX_FILE_COUNT} files`,
    },
    unsupported_format: {
      title: "Unsupported file format",
      description: `Supported file types: ${getFileExtensions()}`,
    },
    file_too_large: {
      title: "File too large",
      description: `Each file must be under ${MAX_FILE_SIZE_MB}MB`,
    },
    general: {
      title: "Something went wrong",
      description: "An error occurred while processing your files",
    },
    dropzone_error: {
      title: "Something went wrong",
      description: "An error occurred while queuing your files",
    },
  };

  const { title, description } = messages[type];

  const show = warnings.includes(type) ? toast.warning : toast.error;

  show(title, {
    description,
    duration: 5000,
    dismissible: true,
  });
};

type FileStatus = "idle" | "processing" | "done" | "failed";

export default function Home() {
  const [fileStore, setFileStore] = useState<File[]>([]);
  const [fileStatuses, setFileStatuses] = useState<Record<number, FileStatus>>({});
  const [processing, setProcessing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const isLoadingUI = loading;

  useEffect(() => {
    const infoTimeout = setTimeout(() => {
      toast.info("You can disable your internet", {
        id: "offline-mode",
        duration: 10000,
        description: "Runs in your browser only. Files never leave your device",
        action: {
          label: "Got it",
          onClick: () => {},
        },
      });
    }, 2000);

    const bmcTimeout = setTimeout(() => {
      toast("Like the app?", {
        id: "support-bmc",
        description: "Support this project on Buy Me a Coffee ☕",
        duration: 10000,
        action: {
          label: "Support",
          onClick: () => {
            window.open("https://buymeacoffee.com/privco", "_blank");
          },
        },
        className: "bg-red-200",
      });
    }, 60000);

    const loadingTimeout = setTimeout(() => setLoading(false), 1000);

    return () => {
      clearTimeout(infoTimeout);
      clearTimeout(bmcTimeout);
      clearTimeout(loadingTimeout);
    };
  }, []);

  const handleFilesAccepted = (newFiles: File[]) => {
    const totalCount = fileStore.length + newFiles.length;
    if (totalCount > MAX_FILE_COUNT) {
      showErrorToast("file_count");
      return;
    }

    setFileStore((prevFiles) => [...prevFiles, ...newFiles].slice(0, MAX_FILE_COUNT));
    toast.success(newFiles.length <= 1 ? "1 File queued" : `${newFiles.length} files queued`, {
      duration: 1700,
    });
  };

  const handleFileRemoved = (index: number) => {
    setFileStore((prevFiles) => prevFiles.filter((_, i) => i !== index));
    setFileStatuses((prev) => {
      const next: Record<number, FileStatus> = {};
      Object.entries(prev).forEach(([k, v]) => {
        const ki = Number(k);
        if (ki < index) next[ki] = v;
        else if (ki > index) next[ki - 1] = v;
      });
      return next;
    });
  };

  const handleMetadataRemoval = async () => {
    setProcessing(true);
    setFileStatuses({});

    await new Promise((res) => setTimeout(res, 1000));

    try {
      const cleanedFiles: File[] = [];
      let failedCount = 0;

      for (let i = 0; i < fileStore.length; i++) {
        const file = fileStore[i];
        setFileStatuses((prev) => ({ ...prev, [i]: "processing" }));

        let cleaned: File | null = null;

        if (file.type === "image/jpeg" || file.type === "image/jpg") {
          cleaned = await stripJpegMetadata(file);
        } else if (file.type.startsWith("image/")) {
          cleaned = await stripImageMetadata(file);
        } else if (file.type === "application/pdf") {
          cleaned = await stripPdfMetadata(file);
        } else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
          cleaned = await stripDocxMetadata(file);
        } else if (file.type.startsWith("video/")) {
          cleaned = await stripVideoMetadata(file);
        } else if (file.type.startsWith("audio/")) {
          cleaned = await stripAudioMetadata(file);
        } else {
          showErrorToast("unsupported_format");
          setFileStatuses((prev) => ({ ...prev, [i]: "failed" }));
          failedCount++;
          continue;
        }

        if (cleaned) {
          const renamed = new File([cleaned], renameWithSuffix(file), {
            type: cleaned.type,
          });
          cleanedFiles.push(renamed);
          setFileStatuses((prev) => ({ ...prev, [i]: "done" }));
        } else {
          setFileStatuses((prev) => ({ ...prev, [i]: "failed" }));
          failedCount++;
        }
      }

      if (cleanedFiles.length === 1) {
        const file = cleanedFiles[0];
        const url = URL.createObjectURL(file);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(url);
      } else if (cleanedFiles.length > 1) {
        const zip = new JSZip();
        cleanedFiles.forEach((file) => zip.file(file.name, file));
        const zipBlob = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "PrivMeta_cleaned.zip";
        a.click();
        URL.revokeObjectURL(url);
      }

      if (failedCount === 0) {
        toast.success("Download ready ✨");
      } else if (cleanedFiles.length > 0) {
        toast.warning(`Download ready — ${failedCount} file${failedCount > 1 ? "s" : ""} failed to process`);
      } else {
        showErrorToast("general");
      }
    } catch (error) {
      console.error("Error during metadata removal:", error);
      showErrorToast("general");
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    document.title = processing ? "PrivMeta | Cleaning metadata..." : "PrivMeta — Remove Metadata from Files Privately";
  }, [processing]);

  return (
    <div className="w-full flex flex-col gap-(--space-xl) sm:gap-(--space-2xl) md:gap-(--space-3xl) h-full items-center py-(--space-lg) sm:py-(--space-3xl) md:py-(--space-2xl)">
      {isLoadingUI ? <HeroSkeleton /> : <Hero />}
      <div className="w-full flex flex-col gap-(--space-lg) sm:gap-(--space-xl) md:gap-(--space-2xl)">
        {isLoadingUI ? (
          <>
            <DropzoneSkeleton />
            <InlineActionsSkeleton />
          </>
        ) : (
          <>
            <Dropzone
              processing={processing}
              fileStore={fileStore}
              fileStatuses={fileStatuses}
              onFilesAccepted={handleFilesAccepted}
              onFileRemove={handleFileRemoved}
              onError={(type: ErrorType) => showErrorToast(type)}
            />
            <div className="w-full flex justify-end gap-(--space-md)">
              <ClearAllButton fileStore={fileStore} setFileStore={setFileStore} processing={processing} />
              <Button
                size="lg"
                className="type-fluid type-button-lg"
                disabled={fileStore.length <= 0 || processing}
                onClick={handleMetadataRemoval}
              >
                {processing && <Loader2 className="animate-spin mr-2" />}
                Remove metadata
              </Button>
            </div>
          </>
        )}
      </div>
      {isLoadingUI ? <DisableInternetSkeleton /> : <DisableInternet />}
      <div className="h-0.75 w-full bg-foreground" />
      {isLoadingUI ? <ShareFunctionsSkeleton /> : <ShareFunctions />}
    </div>
  );
}

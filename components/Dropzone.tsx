"use client";

import React, { useCallback, useRef, useState } from "react";
import { File as FileIcon, X, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "./ui/button";
import Typography from "./Typography";
import { MAX_FILE_SIZE_BYTES, MAX_FILE_COUNT, ACCEPTED_FILE_TYPES, getKindForFilename } from "@/utils/constants";

export type FileStatus = "idle" | "processing" | "done" | "failed";

/** A queued file with a stable id, so statuses and list keys survive removals. */
export type StoredFile = { id: string; file: File };

type DropzoneProps = {
  fileStore: StoredFile[];
  fileStatuses: Record<string, FileStatus>;
  onFilesAccepted: (files: File[]) => void;
  onFileRemove: (id: string) => void;
  onError: (type: "unsupported_format" | "file_too_large" | "dropzone_error") => void;
  processing: boolean;
};

const acceptedExtensions = Array.from(new Set(Object.values(ACCEPTED_FILE_TYPES).flatMap(({ extensions }) => extensions)));
const acceptedExtensionsLabel = acceptedExtensions.map((ext) => ext.replace(/^\./, "").toUpperCase()).join(" · ");

export default function Dropzone({ fileStore, fileStatuses, onFilesAccepted, onFileRemove, onError, processing }: DropzoneProps) {
  const [highlight, setHighlight] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAcceptedType = (file: File) => getKindForFilename(file.name) !== undefined;
  const isAcceptedSize = (file: File) => file.size <= MAX_FILE_SIZE_BYTES;

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      try {
        const fileArray = Array.from(files); // Normalize FileList or File[] to a true array
        const newFiles: File[] = [];

        for (const file of fileArray) {
          if (!isAcceptedType(file)) {
            onError("unsupported_format");
            return;
          }

          if (!isAcceptedSize(file)) {
            onError("file_too_large");
            return;
          }

          newFiles.push(file);
        }

        if (newFiles.length > 0) {
          onFilesAccepted(newFiles);
        }

        if (fileInputRef.current) fileInputRef.current.value = "";
      } catch (error) {
        console.error(error);
        onError("dropzone_error");
      }
    },
    [onError, onFilesAccepted],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      try {
        e.preventDefault();
        setHighlight(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          handleFiles(e.dataTransfer.files);
          e.dataTransfer.clearData();
        }
      } catch (error) {
        console.error(error);
        onError("dropzone_error");
      }
    },
    [onError, handleFiles],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      try {
        if (e.target.files) handleFiles(e.target.files);
      } catch (error) {
        console.error(error);
        onError("dropzone_error");
      }
    },
    [onError, handleFiles],
  );

  const openFilePicker = () => {
    if (!processing && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="w-full flex flex-col gap-(--space-md)">
      <Typography variant="legal" muted className="hidden sm:inline">
        {acceptedExtensionsLabel}
      </Typography>
      <div
        role="button"
        tabIndex={0}
        aria-label="Add files: drag and drop, or activate to browse"
        aria-disabled={processing}
        className={`relative flex flex-col items-center justify-center w-full min-h-72 sm:min-h-84 md:min-h-96 p-(--space-3xl) gap-(--space-lg) border-3 border-dashed rounded-sm transition-colors ${
          highlight ? "border-(--accent-primary) bg-(--accent-secondary)" : "border-foreground"
        } ${processing ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        onClick={openFilePicker}
        onKeyDown={(e) => {
          // Ignore key events bubbling up from the per-file remove buttons
          if (e.target !== e.currentTarget) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openFilePicker();
          }
        }}
        onDragOver={(e) => {
          if (!processing) {
            e.preventDefault();
            setHighlight(true);
          }
        }}
        onDragLeave={() => {
          if (!processing) setHighlight(false);
        }}
        onDrop={(e) => {
          if (!processing) handleDrop(e);
        }}
      >
        <input ref={fileInputRef} type="file" multiple accept={acceptedExtensions.join(",")} onChange={handleChange} className="hidden" />
        <div className="flex flex-col items-center gap-6 text-foreground">
          <div className="flex flex-col items-center text-center leading-tight">
            <Typography as="p" variant="label" className="leading-tight">
              Drag & drop files
            </Typography>
            <Typography as="p" variant="label" className="leading-tight">
              or{" "}
              <Typography as="span" variant="label" weight={600} className="hover:underline text-(--accent-primary)">
                click to add
              </Typography>
            </Typography>
          </div>
        </div>
        {fileStore.length > 0 && (
          <ul className="w-full max-w-lg flex flex-col gap-(--space-sm) text-left text-sm font-bold text-muted-foreground">
            {fileStore.map(({ id, file }) => {
              const status = fileStatuses[id] ?? "idle";
              return (
                <li key={id} className="truncate flex items-center gap-(--space-lg)">
                  <FileIcon className=" shrink-0" size={20} strokeWidth={2} />
                  <Typography as="p" variant="bodySm" weight={500} muted className="truncate flex-1">
                    {file.name}
                  </Typography>
                  {status === "processing" && <Loader2 className="shrink-0 size-5 animate-spin text-muted-foreground" />}
                  {status === "done" && <CheckCircle2 className="shrink-0 size-5 text-green-500" />}
                  {status === "failed" && <XCircle className="shrink-0 size-5 text-red-500" />}
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      onFileRemove(id);
                    }}
                    variant="ghost"
                    size="icon"
                    disabled={processing}
                    aria-label={`Remove ${file.name}`}
                  >
                    <X />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
        <Typography as="p" variant="bodySm" weight={500} muted className="absolute right-(--space-xl) bottom-(--space-md)">
          {`${fileStore.length}/${MAX_FILE_COUNT}`}
        </Typography>
      </div>
    </div>
  );
}

"use client";

import React, { useCallback, useRef, useState } from "react";
import { File, X } from "lucide-react";
import { Button } from "./ui/button";
import { MAX_FILE_SIZE_BYTES, MAX_FILE_COUNT, ACCEPTED_FILE_TYPES } from "@/utils/constants";
import { getFileExtensions } from "@/utils/utils";
import { Skeleton } from "./ui/skeleton";

type DropzoneProps = {
  fileStore: File[];
  onFilesAccepted: (files: File[]) => void;
  onFileRemove: (index: number) => void;
  onError: (type: "unsupported_format" | "file_too_large" | "dropzone_error") => void;
  loading: boolean;
  processing: boolean;
};

const acceptedMimeTypes = Object.keys(ACCEPTED_FILE_TYPES);

export default function Dropzone({ fileStore, onFilesAccepted, onFileRemove, onError, loading, processing }: DropzoneProps) {
  const [highlight, setHighlight] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAcceptedType = (file: File) => acceptedMimeTypes.includes(file.type);
  const isAcceptedSize = (file: File) => file.size <= MAX_FILE_SIZE_BYTES;

  const hasValidExtension = (file: File) => {
    const exts = ACCEPTED_FILE_TYPES[file.type] || [];
    return exts.some((ext) => file.name.toLowerCase().endsWith(ext));
  };

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      try {
        const fileArray = Array.from(files); // Normalize FileList or File[] to a true array
        const newFiles: File[] = [];

        for (const file of fileArray) {
          if (!isAcceptedType(file) || !hasValidExtension(file)) {
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
    [onError, onFilesAccepted]
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
        console.log(error);
        onError("dropzone_error");
      }
    },
    [onError, handleFiles]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      try {
        if (e.target.files) handleFiles(e.target.files);
      } catch (error) {
        console.log(error);
        onError("dropzone_error");
      }
    },
    [onError, handleFiles]
  );

  return (
    <>
      {loading ? (
        <div className="w-full">
          <div className="relative flex flex-col items-center justify-center w-full min-h-96 gap-[var(--space-md)] border-3 border-dashed p-[var(--space-2xl)] rounded-xl border-muted-foreground/50">
            <Skeleton className="h-16 w-16 rounded-md" />
            <Skeleton className="h-5 w-1/4" />
            <Skeleton className="h-4 w-1/6" />
            <Skeleton className="h-4 w-1/2" />
            <div className="absolute text-sm right-[var(--space-xl)] bottom-[var(--space-md)]">
              <Skeleton className="h-4 w-10" />
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full" araria-label="File dropzone">
          <div
            className={`relative flex flex-col items-center justify-center w-full min-h-96 gap-[var(--space-lg)] border-3 border-dashed p-[var(--space-2xl)] rounded-xl transition-colors ${
              highlight ? "border-[var(--accent-primary)] bg-[var(--accent-secondary)]" : "border-muted-foreground/50"
            } ${processing ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            onClick={() => {
              if (!processing && fileInputRef.current) {
                fileInputRef.current.click();
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
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={acceptedMimeTypes.join(",")}
              onChange={handleChange}
              className="hidden"
            />
            <File size={64} strokeWidth={2} />
            <div className="flex flex-col items-center text-lg">
              <p>Drag & drop files</p>
              <p>
                or <span className="text-[var(--accent-primary)] font-bold hover:underline">click to browse</span>
              </p>
            </div>
            <p className="text-sm text-muted-foreground text-center">(Supported file types: {getFileExtensions()})</p>
            {fileStore.length > 0 && (
              <ul className="text-left text-sm font-bold text-muted-foreground">
                {fileStore.map((file, index) => (
                  <li key={index} className="truncate flex items-center gap-[var(--space-sm)]">
                    <File className="mr-[var(--space-sm)]" size={20} strokeWidth={2} />
                    <p className="truncate">{file.name}</p>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        onFileRemove(index);
                      }}
                      variant="ghost"
                      size="icon"
                    >
                      <X />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            <p className="absolute text-sm text-muted-foreground right-[var(--space-xl)] bottom-[var(--space-md)]">
              {`${fileStore.length}/${MAX_FILE_COUNT}`}
            </p>
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import React, { useCallback, useRef, useState } from "react";
import { File, X, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "./ui/button";
import { MAX_FILE_SIZE_BYTES, MAX_FILE_COUNT, ACCEPTED_FILE_TYPES } from "@/utils/constants";

type FileStatus = "idle" | "processing" | "done" | "failed";

type DropzoneProps = {
  fileStore: File[];
  fileStatuses: Record<number, FileStatus>;
  onFilesAccepted: (files: File[]) => void;
  onFileRemove: (index: number) => void;
  onError: (type: "unsupported_format" | "file_too_large" | "dropzone_error") => void;
  processing: boolean;
};

const acceptedMimeTypes = Object.keys(ACCEPTED_FILE_TYPES);

export default function Dropzone({ fileStore, fileStatuses, onFilesAccepted, onFileRemove, onError, processing }: DropzoneProps) {
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
        console.log(error);
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
        console.log(error);
        onError("dropzone_error");
      }
    },
    [onError, handleFiles],
  );

  return (
    <div className="w-full" aria-label="File dropzone">
          <div
            className={`relative flex flex-col items-center justify-center w-full min-h-96 p-(--space-3xl) gap-(--space-lg) border-3 border-dashed rounded-md transition-colors ${
              highlight ? "border-(--accent-primary) bg-(--accent-secondary)" : "border-foreground"
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
            <div className="flex flex-col items-center gap-6 text-lg text-foreground">
              <File className="size-12" strokeWidth={2} />
              <div className="flex flex-col items-center text-center leading-tight">
                <p className="text-xl">Drag & drop files</p>
                <p className="text-xl">
                  or <span className="text-2xl font-semibold hover:underline text-(--accent-primary)">click to browse</span>
                </p>
              </div>
            </div>
            {fileStore.length > 0 && (
              <ul className="w-full max-w-lg flex flex-col gap-(--space-md) text-left text-sm font-bold text-muted-foreground">
                {fileStore.map((file, index) => {
                  const status = fileStatuses[index] ?? "idle";
                  return (
                    <li key={index} className="truncate flex items-center gap-(--space-lg)">
                      <File className=" shrink-0" size={20} strokeWidth={2} />
                      <p className="truncate flex-1">{file.name}</p>
                      {status === "processing" && <Loader2 className="shrink-0 animate-spin text-muted-foreground" size={16} />}
                      {status === "done" && <CheckCircle2 className="shrink-0 text-green-500" size={16} />}
                      {status === "failed" && <XCircle className="shrink-0 text-red-500" size={16} />}
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          onFileRemove(index);
                        }}
                        variant="ghost"
                        size="icon"
                        disabled={processing}
                      >
                        <X />
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
            <p className="absolute text-base text-muted-foreground right-(--space-xl) bottom-(--space-md)">
              {`${fileStore.length}/${MAX_FILE_COUNT}`}
            </p>
          </div>
    </div>
  );
}

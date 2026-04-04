"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "./ui/button";
import Typography from "./Typography";

type ClearAllButtonProps = {
  fileStore: File[];
  setFileStore: (files: File[]) => void;
  processing: boolean;
};

const ClearAllButton = ({ fileStore, setFileStore, processing }: ClearAllButtonProps) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        size="lg"
        className="type-fluid type-button"
        disabled={fileStore.length <= 0 || processing}
        variant="link"
        onClick={() => setOpen(true)}
      >
        Clear all
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-2 border-foreground rounded-(--corner-radius) bg-background shadow-none p-(--space-xl) gap-(--space-lg)">
          <DialogHeader className="items-start text-left gap-(--space-sm)">
            <DialogTitle className="leading-none">
              <Typography as="span" variant="label" weight={600}>
                Clear all files?
              </Typography>
            </DialogTitle>
            <DialogDescription>
              <Typography as="span" variant="bodySm" muted>
                Are you sure you want to clear all files? This can&apos;t be undone.
              </Typography>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-(--space-lg)">
            <Button
              className="type-fluid type-button border-2 border-foreground bg-background text-foreground hover:bg-muted"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="type-fluid type-button border-2 border-foreground text-white"
              onClick={() => {
                setFileStore([]);
                setOpen(false);
              }}
            >
              Clear all
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ClearAllButton;

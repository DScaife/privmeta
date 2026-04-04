import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "./ui/button";
import Typography from "./Typography";

type ClearAllButtonProps = {
  fileStore: File[];
  setFileStore: (files: File[]) => void;
  processing: boolean;
};

const ClearAllButton = ({ fileStore, setFileStore, processing }: ClearAllButtonProps) => (
  <AlertDialog>
    <AlertDialogTrigger asChild>
      <Button size="lg" className="type-fluid type-button" disabled={fileStore.length <= 0 || processing} variant="link">
        Clear all
      </Button>
    </AlertDialogTrigger>
    <AlertDialogContent className="border-2 border-foreground rounded-(--corner-radius) bg-background shadow-none p-(--space-xl) gap-(--space-lg)">
      <AlertDialogHeader className="items-start text-left gap-(--space-sm)">
        <AlertDialogTitle className="leading-none">
          <Typography as="span" variant="label" weight={600}>
            Clear all files?
          </Typography>
        </AlertDialogTitle>
        <AlertDialogDescription>
          <Typography as="span" variant="bodySm" muted>
            Are you sure you want to clear all files? This can&apos;t be undone.
          </Typography>
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter className="gap-(--space-lg)">
        <AlertDialogCancel className="type-fluid type-button border-2 border-foreground bg-background text-foreground hover:bg-muted">
          Cancel
        </AlertDialogCancel>
        <AlertDialogAction
          variant="destructive"
          onClick={() => setFileStore([])}
          className="type-fluid type-button border-2 border-foreground text-foreground"
        >
          Clear all
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

export default ClearAllButton;

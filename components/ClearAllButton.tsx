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

type ClearAllButtonProps = {
  fileStore: File[];
  setFileStore: (files: File[]) => void;
  processing: boolean;
};

const ClearAllButton = ({ fileStore, setFileStore, processing }: ClearAllButtonProps) => (
  <AlertDialog>
    <AlertDialogTrigger asChild>
      <Button disabled={fileStore.length <= 0 || processing} variant="ghost">
        Clear all
      </Button>
    </AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Clear all files?</AlertDialogTitle>
        <AlertDialogDescription>Are you sure you want to clear all files? This can’t be undone.</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction onClick={() => setFileStore([])} className="bg-destructive hover:bg-destructive/90">
          Continue
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

export default ClearAllButton;

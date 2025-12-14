import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "./ui/separator";
import { Bookmark, Copy, Check, Coffee } from "lucide-react";
import Link from "next/link";

const ShareFunctions = () => {
  const SHARE_URL = "https://privmeta.com/";
  const [copied, setCopied] = useState(false);

  const openShare = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(SHARE_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleBookmark = () => {
    if (typeof window !== "undefined" && "bookmark" in navigator === false) {
      alert("Press Ctrl+D (or Cmd+D on Mac) to bookmark this page.");
    }
  };

  return (
    <div className="w-full flex flex-col gap-[var(--space-lg)] py-[var(--space-lg)] px-[var(--space-xl)]">
      {/* Social sharing */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-6">
        <p className="w-36">Sharing is caring</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button
            variant="outline"
            className="border-[var(--foreground)]"
            onClick={() => openShare(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(SHARE_URL)}`)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              className="bi bi-facebook"
              viewBox="0 0 16 16"
            >
              <path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951" />
            </svg>
            Facebook
          </Button>
          <Button
            variant="outline"
            className="border-[var(--foreground)]"
            onClick={() => openShare(`https://twitter.com/intent/tweet?url=${encodeURIComponent(SHARE_URL)}`)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              className="bi bi-twitter-x"
              viewBox="0 0 16 16"
            >
              <path d="M12.6.75h2.454l-5.36 6.142L16 15.25h-4.937l-3.867-5.07-4.425 5.07H.316l5.733-6.57L0 .75h5.063l3.495 4.633L12.601.75Zm-.86 13.028h1.36L4.323 2.145H2.865z" />
            </svg>
            Twitter
          </Button>
          <Button
            variant="outline"
            className="border-[var(--foreground)]"
            onClick={() => openShare(`https://www.reddit.com/submit?url=${encodeURIComponent(SHARE_URL)}`)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-reddit" viewBox="0 0 16 16">
              <path d="M6.167 8a.83.83 0 0 0-.83.83c0 .459.372.84.83.831a.831.831 0 0 0 0-1.661m1.843 3.647c.315 0 1.403-.038 1.976-.611a.23.23 0 0 0 0-.306.213.213 0 0 0-.306 0c-.353.363-1.126.487-1.67.487-.545 0-1.308-.124-1.671-.487a.213.213 0 0 0-.306 0 .213.213 0 0 0 0 .306c.564.563 1.652.61 1.977.61zm.992-2.807c0 .458.373.83.831.83s.83-.381.83-.83a.831.831 0 0 0-1.66 0z" />
              <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-3.828-1.165c-.315 0-.602.124-.812.325-.801-.573-1.9-.945-3.121-.993l.534-2.501 1.738.372a.83.83 0 1 0 .83-.869.83.83 0 0 0-.744.468l-1.938-.41a.2.2 0 0 0-.153.028.2.2 0 0 0-.086.134l-.592 2.788c-1.24.038-2.358.41-3.17.992-.21-.2-.496-.324-.81-.324a1.163 1.163 0 0 0-.478 2.224q-.03.17-.029.353c0 1.795 2.091 3.256 4.669 3.256s4.668-1.451 4.668-3.256c0-.114-.01-.238-.029-.353.401-.181.688-.592.688-1.069 0-.65-.525-1.165-1.165-1.165" />
            </svg>
            Reddit
          </Button>
          <Button
            variant="outline"
            className="border-[var(--foreground)]"
            onClick={() => openShare(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(SHARE_URL)}`)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              className="bi bi-linkedin"
              viewBox="0 0 16 16"
            >
              <path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854zm4.943 12.248V6.169H2.542v7.225zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248S2.4 3.226 2.4 3.934c0 .694.521 1.248 1.327 1.248zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016l.016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225z" />
            </svg>
            LinkedIn
          </Button>
        </div>
      </div>

      <Separator />

      {/* Bookmark */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-6">
        <p className="w-36">Come back!</p>
        <Button variant="outline" className="border-[var(--foreground)]" onClick={handleBookmark}>
          <Bookmark />
          Bookmark page
        </Button>
      </div>

      <Separator />

      {/* Link */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-6">
        <p className="w-36">Link to this tool</p>
        <div className="relative w-full sm:max-w-sm">
          <Input readOnly value={SHARE_URL} className="border-[var(--foreground)]" />
          <Button onClick={handleCopy} className="absolute right-0 rounded-l-none">
            {copied ? <Check /> : <Copy />}
          </Button>
        </div>
      </div>

      <Separator />

      {/* BMC */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-6">
        <p className="w-36">Support this project</p>
        <Link href="https://buymeacoffee.com/privco" target="_blank" rel="noopener noreferrer">
          <Button variant="outline" aria-label="Support me on Buy Me a Coffee" className="border-[var(--foreground)]">
            <Coffee />
            Buy me a coffee
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default ShareFunctions;

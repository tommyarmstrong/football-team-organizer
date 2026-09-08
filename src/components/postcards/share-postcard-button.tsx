"use client";

import { useEffect, useState } from "react";
import { CopyIcon, DownloadIcon, Share2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ErrorBanner } from "@/components/shared/error-banner";
import {
  canSharePostcardFile,
  copyPostcardCaption,
  postcardFileFromBlob,
} from "@/lib/postcards/share";

const iconButtonClassName =
  "text-muted-foreground hover:bg-muted hover:text-foreground inline-flex size-11 items-center justify-center rounded-md transition-colors sm:size-9";

export function SharePostcardButton({
  imageUrl,
  caption,
  fileName,
}: {
  imageUrl: string;
  caption: string;
  fileName: string;
}) {
  const [open, setOpen] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const objectUrls: string[] = [];

    void (async () => {
      try {
        const response = await fetch(imageUrl, { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Could not load postcard.");
        }
        const blob = await response.blob();
        if (cancelled) return;
        const nextFile = postcardFileFromBlob(blob, fileName);
        const url = URL.createObjectURL(blob);
        objectUrls.push(url);
        setFile(nextFile);
        setBlobUrl(url);
      } catch {
        if (!cancelled) {
          setLoadError("Could not load the postcard. Try again in a moment.");
        }
      }
    })();

    return () => {
      cancelled = true;
      for (const url of objectUrls) URL.revokeObjectURL(url);
    };
  }, [open, imageUrl, fileName]);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setBlobUrl(null);
      setFile(null);
      setLoadError(null);
      setCopied(false);
    }
  }

  const canShare = file ? canSharePostcardFile(file) : false;

  async function handleShare() {
    if (!file || typeof navigator.share !== "function") return;
    setSharing(true);
    try {
      await navigator.share({
        files: [file],
        text: caption,
        title: fileName.replace(/\.png$/i, ""),
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setLoadError("Sharing was cancelled or is not available on this device.");
    } finally {
      setSharing(false);
    }
  }

  function handleSave() {
    if (!blobUrl) return;
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = fileName;
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  async function handleCopy() {
    const ok = await copyPostcardCaption(caption);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label="Share postcard"
        title="Share postcard"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        className={iconButtonClassName}
      >
        <Share2Icon className="size-4" aria-hidden="true" />
      </button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md" showCloseButton>
          <DialogHeader>
            <DialogTitle>Match postcard</DialogTitle>
            <DialogDescription>
              Share a recap of this result. Player names follow the team’s
              privacy rules.
            </DialogDescription>
          </DialogHeader>

          {loadError ? <ErrorBanner message={loadError} /> : null}

          {blobUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={blobUrl}
              alt="Match postcard"
              className="border-border h-auto w-full rounded-lg border"
            />
          ) : loadError ? null : (
            <p className="text-muted-foreground text-sm">Loading postcard…</p>
          )}

          <DialogFooter className="sm:flex-col sm:items-stretch">
            {canShare ? (
              <Button
                type="button"
                onClick={() => void handleShare()}
                disabled={!file || sharing}
              >
                {sharing ? "Sharing…" : "Share"}
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              onClick={handleSave}
              disabled={!blobUrl}
            >
              <DownloadIcon />
              Save image
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => void handleCopy()}
            >
              <CopyIcon />
              {copied ? "Copied" : "Copy caption"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

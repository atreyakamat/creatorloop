"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { Button, TextArea } from "@/components/ui";
import { FormAlert } from "@/components/form-alert";
import { createClient } from "@/lib/supabase/client";
import { MAX_VIDEO_BYTES, SUBMISSIONS_BUCKET, VIDEO_TYPES } from "@/lib/video";
import { submitReel } from "../../actions";

// Uploads straight from the phone to private storage (storage policies allow only
// this creator's folder for this brief), then records the reel on the server.
export function ReelUploader({ briefId, userId }: { briefId: string; userId: string }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [busy, setBusy] = useState<"idle" | "uploading" | "saving">("idle");
  const [error, setError] = useState<string>();
  const [done, setDone] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    setDone(false);

    const file = fileRef.current?.files?.[0];
    if (!file) return setError("Choose a video first.");
    const ext = VIDEO_TYPES[file.type];
    if (!ext) return setError("Upload an MP4, MOV or WebM video.");
    if (file.size > MAX_VIDEO_BYTES) return setError("That video is over 50 MB. Export it at a smaller size and try again.");

    const caption = String(new FormData(event.currentTarget).get("caption") ?? "");
    const path = `${userId}/${briefId}/${crypto.randomUUID()}.${ext}`;

    setBusy("uploading");
    const { error: uploadError } = await createClient()
      .storage.from(SUBMISSIONS_BUCKET)
      .upload(path, file, { contentType: file.type, upsert: false });
    if (uploadError) {
      setBusy("idle");
      return setError("Upload failed. Check your connection and try again.");
    }

    setBusy("saving");
    const result = await submitReel({ briefId, path, caption });
    setBusy("idle");
    if (result.error) return setError(result.error);

    formRef.current?.reset();
    setDone(true);
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-4 rounded-2xl bg-sand-50 p-4">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink-700">Video (MP4, MOV or WebM, up to 50 MB)</span>
        <input
          ref={fileRef}
          type="file"
          name="video"
          accept="video/mp4,video/quicktime,video/webm"
          required
          className="block w-full text-sm text-ink-700 file:mr-3 file:rounded-full file:border-0 file:bg-ink-950 file:px-4 file:py-2 file:text-sm file:font-medium file:text-sand-50"
        />
      </label>
      <TextArea label="Caption you suggest (optional)" name="caption" maxLength={2200} rows={2} />
      <FormAlert error={error} message={done ? "Reel sent to the business for review." : undefined} />
      <Button type="submit" variant="accent" disabled={busy !== "idle"}>
        <Upload className="size-4" aria-hidden />
        {busy === "uploading" ? "Uploading…" : busy === "saving" ? "Saving…" : "Upload reel"}
      </Button>
    </form>
  );
}

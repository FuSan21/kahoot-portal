"use client";

import { ImagePlus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

const MAX_BYTES = 10 * 1024 * 1024;

/** Click or drop one image; shows a preview and revokes its object URL when replaced. */
export function ImagePicker({
  file,
  onChange,
  label,
  className,
}: {
  file: File | null;
  onChange: (file: File | null) => void;
  label: string;
  className?: string;
}) {
  const [over, setOver] = useState(false);
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  function accept(f: File | undefined) {
    if (!f || !f.type.startsWith("image/") || f.size > MAX_BYTES) return;
    onChange(f);
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border-2 border-dashed border-line bg-surface-2/40 transition-colors",
        over && "border-primary",
        preview && "border-solid",
        className,
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        accept(e.dataTransfer.files[0]);
      }}
    >
      {preview ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- local object URL preview */}
          <img src={preview} alt="" className="absolute inset-0 size-full object-cover" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute top-2 right-2 grid size-8 place-items-center rounded-full bg-black/70 text-white transition hover:bg-black"
            aria-label="Remove image"
          >
            <X className="size-4" />
          </button>
        </>
      ) : (
        <label className="flex size-full cursor-pointer flex-col items-center justify-center gap-2 p-4 text-center">
          <ImagePlus className="size-6 text-muted-foreground" />
          <span className="text-sm">{label}</span>
          <span className="text-xs text-muted-foreground">Drop or click · up to 10 MB</span>
          <input type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" className="sr-only" onChange={(e) => accept(e.target.files?.[0])} />
        </label>
      )}
    </div>
  );
}

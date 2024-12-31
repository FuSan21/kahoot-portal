import * as React from "react";
import { useDropzone, FileRejection, Accept } from "react-dropzone";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ImageIcon, UploadIcon } from "lucide-react";

interface FileUploadProps {
  className?: string;
  value?: File | null;
  onChange?: (file: File | null) => void;
  onRemove?: () => void;
  accept?: Accept;
}

export function FileUpload({
  className,
  value,
  onChange,
  onRemove,
  accept = {
    "image/*": [],
  },
  ...props
}: FileUploadProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept,
    maxFiles: 1,
    onDrop: (acceptedFiles: File[]) => {
      if (acceptedFiles?.[0]) {
        onChange?.(acceptedFiles[0]);
      }
    },
  });

  return (
    <div className={cn("grid w-full gap-1.5", className)} {...props}>
      {value ? (
        <div className="relative mt-2 flex items-center justify-center rounded-lg border border-dashed border-muted-foreground/25 p-6">
          <div className="text-center">
            {value.type.startsWith("image/") ? (
              <div className="mx-auto flex flex-col items-center gap-1">
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
                <img
                  src={URL.createObjectURL(value)}
                  alt="Preview"
                  className="mt-2 max-h-32 rounded-lg object-cover"
                />
              </div>
            ) : null}
            <div className="mt-2 flex items-center justify-center gap-2">
              <span className="text-sm text-muted-foreground">
                {value.name}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="ml-auto h-8"
                onClick={() => {
                  onRemove?.();
                  onChange?.(null);
                }}
              >
                Remove
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={cn(
            "relative mt-2 flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-muted-foreground/25 p-6 transition-colors hover:bg-muted/25",
            isDragActive && "bg-muted/25",
            className
          )}
        >
          <div className="text-center">
            <UploadIcon className="mx-auto h-8 w-8 text-muted-foreground" />
            <div className="mt-2">
              <input {...getInputProps()} />
              <p className="text-sm text-muted-foreground">
                Drag & drop a file here, or click to select
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

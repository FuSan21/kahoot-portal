import * as React from "react";
import { useDropzone, FileRejection, Accept } from "react-dropzone";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ImageIcon, UploadIcon } from "lucide-react";

interface MultiFileUploadProps {
  className?: string;
  value?: File[];
  onChange?: (files: File[]) => void;
  onRemove?: (index: number) => void;
  accept?: Accept;
}

export function MultiFileUpload({
  className,
  value = [],
  onChange,
  onRemove,
  accept = {
    "image/*": [],
  },
  ...props
}: MultiFileUploadProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept,
    onDrop: (acceptedFiles: File[]) => {
      if (acceptedFiles?.length > 0) {
        onChange?.(acceptedFiles);
      }
    },
  });

  return (
    <div className={cn("grid w-full gap-1.5", className)} {...props}>
      {value.length > 0 ? (
        <div className="relative mt-2 flex flex-col gap-2">
          {value.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between rounded-lg border border-dashed border-muted-foreground/25 p-4"
            >
              <div className="flex items-center gap-2">
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {file.name}
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8"
                onClick={() => onRemove?.(index)}
              >
                Remove
              </Button>
            </div>
          ))}
          <div
            {...getRootProps()}
            className={cn(
              "flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-muted-foreground/25 p-6 transition-colors hover:bg-muted/25",
              isDragActive && "bg-muted/25",
              className
            )}
          >
            <div className="text-center">
              <UploadIcon className="mx-auto h-8 w-8 text-muted-foreground" />
              <div className="mt-2">
                <input {...getInputProps()} />
                <p className="text-sm text-muted-foreground">
                  Drag & drop more files here, or click to select
                </p>
              </div>
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
                Drag & drop files here, or click to select
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

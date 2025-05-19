import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Slot } from "radix-ui"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap outline-none select-none disabled:pointer-events-none disabled:opacity-40 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-[color-mix(in_oklab,var(--primary)_86%,var(--p-ink))]",
        destructive: "bg-destructive text-[#1a0606] hover:bg-[color-mix(in_oklab,var(--destructive)_86%,var(--p-ink))]",
        outline:
          "border border-input bg-transparent text-foreground hover:border-[var(--p-muted)] hover:bg-white/[0.04]",
        secondary: "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklab,var(--secondary)_86%,var(--p-ink))]",
        ghost: "text-foreground hover:bg-white/[0.06]",
        link: "text-foreground underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5 text-[15px] has-[>svg]:px-4",
        xs: "h-7 gap-1 px-2.5 text-xs has-[>svg]:px-2 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1.5 px-4 text-sm has-[>svg]:px-3",
        lg: "h-12 px-6 text-base has-[>svg]:px-5",
        xl: "h-16 px-9 text-lg has-[>svg]:px-8 [&_svg:not([class*='size-'])]:size-5",
        icon: "size-11",
        "icon-xs": "size-7 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-9",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }

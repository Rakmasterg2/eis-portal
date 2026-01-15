"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7a00df] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[#32373c] text-white hover:bg-[#424850] rounded-[9999px] shadow-sm hover:shadow-md",
        primary: "bg-[#7a00df] text-white hover:bg-[#6600bd] rounded-[9999px] shadow-sm hover:shadow-md",
        destructive: "bg-red-600 text-white hover:bg-red-700 rounded-[9999px]",
        outline: "border border-gray-300 bg-white hover:bg-gray-50 text-gray-900 rounded-[9999px]",
        secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 rounded-[9999px]",
        ghost: "hover:bg-gray-100 text-gray-900 rounded-lg",
        link: "text-[#7a00df] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-7 py-2",
        sm: "h-9 px-5 text-xs",
        lg: "h-12 px-8 text-base",
        icon: "h-10 w-10 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }

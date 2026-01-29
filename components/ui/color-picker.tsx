"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Palette } from "lucide-react"
import { cn } from "@/lib/utils"

interface ColorPickerProps {
  value?: string
  onChange: (color: string) => void
  disabled?: boolean
  placeholder?: string
}

export function ColorPicker({ value = "#000000", onChange, disabled, placeholder = "Select a color" }: ColorPickerProps) {
  const [localColor, setLocalColor] = React.useState(value)
  const colorInputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    setLocalColor(value)
  }, [value])

  const handleColorChange = (newColor: string) => {
    setLocalColor(newColor)
    onChange(newColor)
  }

  const displayColor = value || localColor

  const handleColorSwatchClick = () => {
    if (!disabled && colorInputRef.current) {
      colorInputRef.current.click()
    }
  }

  return (
    <div className="relative w-full">
      <Button
        variant="outline"
        className={cn(
          "w-full justify-start text-left font-normal relative",
          !value && "text-muted-foreground"
        )}
        disabled={disabled}
        onClick={handleColorSwatchClick}
        type="button"
      >
        <input
          ref={colorInputRef}
          type="color"
          value={displayColor}
          onChange={(e) => handleColorChange(e.target.value)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={disabled}
        />
        <div className="flex w-full items-center gap-2 relative z-10">
          {displayColor ? (
            <div
              className="h-4 w-4 rounded border border-gray-300"
              style={{ background: displayColor }}
            />
          ) : (
            <div className="h-4 w-4 rounded border border-gray-300" />
          )}
          <div className="flex-1 truncate">
            {displayColor ? displayColor : <span className="text-muted-foreground">{placeholder}</span>}
          </div>
          <Palette className="h-4 w-4 text-gray-400" />
        </div>
      </Button>
    </div>
  )
}

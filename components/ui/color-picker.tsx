'use client';

import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Check, Palette, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

// Predefined color options with friendly names
const colorOptions = [
  // Rainbow Order - ROYGBIV + Neutrals
  
  // Reds
  { name: 'Red', value: '#ef4444', bg: 'bg-red-500' },
  { name: 'Rose Red', value: '#f43f5e', bg: 'bg-rose-500' },
  { name: 'Pink Red', value: '#ec4899', bg: 'bg-pink-500' },
  { name: 'Dark Red', value: '#dc2626', bg: 'bg-red-600' },
  { name: 'Light Red', value: '#f87171', bg: 'bg-red-400' },
  { name: 'Coral', value: '#ff6b6b', bg: 'bg-red-400' },
  { name: 'Maroon', value: '#be123c', bg: 'bg-rose-700' },
  { name: 'Burgundy', value: '#9f1239', bg: 'bg-rose-800' },
  
  // Oranges
  { name: 'Orange', value: '#f97316', bg: 'bg-orange-500' },
  { name: 'Amber', value: '#f59e0b', bg: 'bg-amber-500' },
  { name: 'Dark Orange', value: '#ea580c', bg: 'bg-orange-600' },
  { name: 'Light Orange', value: '#fb923c', bg: 'bg-orange-400' },
  { name: 'Salmon', value: '#fdba74', bg: 'bg-orange-300' },
  { name: 'Peach', value: '#fb7185', bg: 'bg-rose-400' },
  
  // Yellows
  { name: 'Yellow', value: '#eab308', bg: 'bg-yellow-500' },
  { name: 'Gold', value: '#fbbf24', bg: 'bg-amber-400' },
  { name: 'Dark Yellow', value: '#ca8a04', bg: 'bg-yellow-600' },
  { name: 'Light Yellow', value: '#facc15', bg: 'bg-yellow-400' },
  { name: 'Cream', value: '#fef3c7', bg: 'bg-amber-100' },
  
  // Greens
  { name: 'Green', value: '#22c55e', bg: 'bg-green-500' },
  { name: 'Emerald', value: '#10b981', bg: 'bg-emerald-500' },
  { name: 'Teal', value: '#14b8a6', bg: 'bg-teal-500' },
  { name: 'Dark Green', value: '#16a34a', bg: 'bg-green-600' },
  { name: 'Light Green', value: '#4ade80', bg: 'bg-green-400' },
  { name: 'Forest Green', value: '#059669', bg: 'bg-emerald-600' },
  { name: 'Lime', value: '#84cc16', bg: 'bg-lime-500' },
  { name: 'Olive', value: '#65a30d', bg: 'bg-lime-600' },
  { name: 'Mint', value: '#34d399', bg: 'bg-emerald-400' },
  { name: 'Sage', value: '#22d3ee', bg: 'bg-cyan-400' },
  { name: 'Turquoise', value: '#2dd4bf', bg: 'bg-teal-400' },
  
  // Blues
  { name: 'Blue', value: '#3b82f6', bg: 'bg-blue-500' },
  { name: 'Sky', value: '#0ea5e9', bg: 'bg-sky-500' },
  { name: 'Cyan', value: '#06b6d4', bg: 'bg-cyan-500' },
  { name: 'Dark Blue', value: '#2563eb', bg: 'bg-blue-600' },
  { name: 'Light Blue', value: '#60a5fa', bg: 'bg-blue-400' },
  { name: 'Navy Blue', value: '#1e3a8a', bg: 'bg-blue-800' },
  { name: 'Navy', value: '#1e40af', bg: 'bg-blue-800' },
  { name: 'Cobalt', value: '#3730a3', bg: 'bg-indigo-700' },
  { name: 'Slate Blue', value: '#334155', bg: 'bg-slate-700' },
  
  // Indigos & Violets
  { name: 'Indigo', value: '#6366f1', bg: 'bg-indigo-500' },
  { name: 'Purple', value: '#a855f7', bg: 'bg-purple-500' },
  { name: 'Violet', value: '#8b5cf6', bg: 'bg-violet-500' },
  { name: 'Fuchsia', value: '#d946ef', bg: 'bg-fuchsia-500' },
  { name: 'Dark Purple', value: '#9333ea', bg: 'bg-purple-600' },
  { name: 'Light Purple', value: '#c084fc', bg: 'bg-purple-400' },
  { name: 'Lavender', value: '#a78bfa', bg: 'bg-violet-400' },
  { name: 'Plum', value: '#7c3aed', bg: 'bg-violet-600' },
  
  // Neutral Colors - Grays, Browns, Whites
  { name: 'Gray', value: '#6b7280', bg: 'bg-gray-500' },
  { name: 'Slate', value: '#64748b', bg: 'bg-slate-500' },
  { name: 'Zinc', value: '#71717a', bg: 'bg-zinc-500' },
  { name: 'Neutral', value: '#737373', bg: 'bg-neutral-500' },
  { name: 'Stone', value: '#78716c', bg: 'bg-stone-500' },
  { name: 'Dark Gray', value: '#4b5563', bg: 'bg-gray-600' },
  { name: 'Light Gray', value: '#9ca3af', bg: 'bg-gray-400' },
  { name: 'Warm Gray', value: '#a8a29e', bg: 'bg-stone-400' },
  { name: 'Cool Gray', value: '#94a3b8', bg: 'bg-slate-400' },
  { name: 'Charcoal', value: '#374151', bg: 'bg-gray-700' },
  { name: 'Silver', value: '#d1d5db', bg: 'bg-gray-300' },
  
  { name: 'Brown', value: '#a16207', bg: 'bg-amber-700' },
  { name: 'Dark Brown', value: '#92400e', bg: 'bg-amber-800' },
  { name: 'Light Brown', value: '#fcd34d', bg: 'bg-amber-300' },
  { name: 'Rust', value: '#78350f', bg: 'bg-amber-900' },
  { name: 'Bronze', value: '#cd7f32', bg: 'bg-amber-600' },
  
  { name: 'Warm White', value: '#f8fafc', bg: 'bg-slate-50' },
  { name: 'Ivory', value: '#fafaf9', bg: 'bg-stone-50' },
];

interface ColorPickerProps {
  value?: string;
  onChange: (color: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ColorPicker({ value, onChange, disabled, placeholder = "Select a color" }: ColorPickerProps) {
  const selectedColor = colorOptions.find(color => color.value === value);

  const handleColorSelect = (color: string) => {
    onChange(color);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between h-10"
          disabled={disabled}
        >
          <div className="flex items-center gap-2">
            {selectedColor ? (
              <>
                <div 
                  className="w-4 h-4 rounded-full border border-gray-300"
                  style={{ backgroundColor: selectedColor.value }}
                />
                <span className="text-sm">{selectedColor.name}</span>
              </>
            ) : (
              <>
                <Palette className="h-4 w-4 text-gray-400" />
                <span className="text-gray-500">{placeholder}</span>
              </>
            )}
          </div>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </Button>
      </DropdownMenuTrigger>
             <DropdownMenuContent className="w-[420px] p-2" align="start">
        <div className="space-y-2">
          <div className="px-2 py-1 text-sm font-medium text-gray-900">Choose a color</div>
          
          {/* Rainbow Grid - All Colors */}
          <div className="grid grid-cols-6 gap-1">
            {colorOptions.map((color) => (
              <DropdownMenuItem
                key={color.value}
                onClick={() => handleColorSelect(color.value)}
                className="p-1 h-12 w-12 flex items-center justify-center hover:scale-110 transition-transform"
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-lg border-2 transition-all",
                    color.bg,
                    value === color.value 
                      ? "border-blue-600 ring-2 ring-blue-200" 
                      : "border-gray-300 hover:border-gray-400"
                  )}
                >
                  {value === color.value && (
                    <Check className="h-6 w-6 text-white drop-shadow-sm m-auto mt-2" />
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </div>
          
          {value && (
            <div className="pt-2 border-t border-gray-200">
              <div className="flex items-center gap-2 text-sm text-gray-600 px-2">
                <span>Selected:</span>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded-full border-2 border-gray-400"
                    style={{ backgroundColor: value }}
                  />
                  <span className="font-medium">{selectedColor?.name}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 
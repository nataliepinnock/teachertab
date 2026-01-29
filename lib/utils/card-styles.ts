// Card style definitions for lesson cards in calendar views
// Each style defines how lesson cards appear with different visual treatments

export type CardStyle = {
  id: string;
  name: string;
  borderClass: string; // e.g., 'border-2', 'border', 'border-4', 'border-0'
  roundedClass: string; // e.g., 'rounded-md', 'rounded-lg', 'rounded-full'
  shadowClass: string; // e.g., 'shadow-sm', 'shadow-md', 'shadow-none'
  hoverShadowClass: string; // e.g., 'hover:shadow-md', 'hover:shadow-lg'
  paddingClass: string; // e.g., 'px-1.5 py-1', 'px-2 py-1.5'
  backgroundOpacity: number; // 0-1 for background color opacity
  borderOpacity: number; // 0-1 for border color opacity
};

export const CARD_STYLES: CardStyle[] = [
  {
    id: 'classic',
    name: 'Classic',
    borderClass: 'border-2',
    roundedClass: 'rounded-md',
    shadowClass: 'shadow-sm',
    hoverShadowClass: 'hover:shadow-md',
    paddingClass: 'px-1.5 py-1',
    backgroundOpacity: 0.4,
    borderOpacity: 0.67
  },
  {
    id: 'minimal',
    name: 'Minimal',
    borderClass: 'border',
    roundedClass: 'rounded-sm',
    shadowClass: 'shadow-none',
    hoverShadowClass: 'hover:shadow-sm',
    paddingClass: 'px-2 py-1',
    backgroundOpacity: 0.3,
    borderOpacity: 0.5
  },
  {
    id: 'rounded',
    name: 'Rounded',
    borderClass: 'border-2',
    roundedClass: 'rounded-lg',
    shadowClass: 'shadow-sm',
    hoverShadowClass: 'hover:shadow-lg',
    paddingClass: 'px-2 py-1.5',
    backgroundOpacity: 0.4,
    borderOpacity: 0.7
  },
  {
    id: 'bold',
    name: 'Bold',
    borderClass: 'border-4',
    roundedClass: 'rounded-md',
    shadowClass: 'shadow-md',
    hoverShadowClass: 'hover:shadow-xl',
    paddingClass: 'px-2 py-1.5',
    backgroundOpacity: 0.5,
    borderOpacity: 0.9
  },
  {
    id: 'soft',
    name: 'Soft',
    borderClass: 'border',
    roundedClass: 'rounded-xl',
    shadowClass: 'shadow-sm',
    hoverShadowClass: 'hover:shadow-md',
    paddingClass: 'px-2.5 py-2',
    backgroundOpacity: 0.35,
    borderOpacity: 0.4
  },
  {
    id: 'outlined',
    name: 'Outlined',
    borderClass: 'border-2',
    roundedClass: 'rounded-md',
    shadowClass: 'shadow-none',
    hoverShadowClass: 'hover:shadow-sm',
    paddingClass: 'px-2 py-1',
    backgroundOpacity: 0.2,
    borderOpacity: 0.8
  },
  {
    id: 'elevated',
    name: 'Elevated',
    borderClass: 'border',
    roundedClass: 'rounded-lg',
    shadowClass: 'shadow-md',
    hoverShadowClass: 'hover:shadow-2xl',
    paddingClass: 'px-2 py-1.5',
    backgroundOpacity: 0.45,
    borderOpacity: 0.6
  },
  {
    id: 'flat',
    name: 'Flat',
    borderClass: 'border-0',
    roundedClass: 'rounded-none',
    shadowClass: 'shadow-none',
    hoverShadowClass: 'hover:shadow-sm',
    paddingClass: 'px-2 py-1',
    backgroundOpacity: 0.5,
    borderOpacity: 0
  },
  {
    id: 'pill',
    name: 'Pill',
    borderClass: 'border-2',
    roundedClass: 'rounded-full',
    shadowClass: 'shadow-sm',
    hoverShadowClass: 'hover:shadow-md',
    paddingClass: 'px-3 py-1.5',
    backgroundOpacity: 0.4,
    borderOpacity: 0.7
  },
  {
    id: 'modern',
    name: 'Modern',
    borderClass: 'border',
    roundedClass: 'rounded-2xl',
    shadowClass: 'shadow-lg',
    hoverShadowClass: 'hover:shadow-xl',
    paddingClass: 'px-2.5 py-2',
    backgroundOpacity: 0.4,
    borderOpacity: 0.5
  },
  {
    id: 'vibrant',
    name: 'Vibrant',
    borderClass: 'border-2',
    roundedClass: 'rounded-lg',
    shadowClass: 'shadow-md',
    hoverShadowClass: 'hover:shadow-lg',
    paddingClass: 'px-2 py-1.5',
    backgroundOpacity: 0.6,
    borderOpacity: 1.0
  },
  {
    id: 'subtle',
    name: 'Subtle',
    borderClass: 'border',
    roundedClass: 'rounded-md',
    shadowClass: 'shadow-none',
    hoverShadowClass: 'hover:shadow-sm',
    paddingClass: 'px-2 py-1',
    backgroundOpacity: 0.15,
    borderOpacity: 0.3
  },
  {
    id: 'neon',
    name: 'Neon',
    borderClass: 'border-2',
    roundedClass: 'rounded-lg',
    shadowClass: 'shadow-lg',
    hoverShadowClass: 'hover:shadow-xl',
    paddingClass: 'px-2 py-1.5',
    backgroundOpacity: 0.25,
    borderOpacity: 1.0
  },
  {
    id: 'muted',
    name: 'Muted',
    borderClass: 'border',
    roundedClass: 'rounded-md',
    shadowClass: 'shadow-sm',
    hoverShadowClass: 'hover:shadow-md',
    paddingClass: 'px-2 py-1',
    backgroundOpacity: 0.25,
    borderOpacity: 0.35
  },
  {
    id: 'colorful',
    name: 'Colorful',
    borderClass: 'border-2',
    roundedClass: 'rounded-lg',
    shadowClass: 'shadow-sm',
    hoverShadowClass: 'hover:shadow-md',
    paddingClass: 'px-2 py-1.5',
    backgroundOpacity: 0.7,
    borderOpacity: 0.6
  },
  {
    id: 'outline-heavy',
    name: 'Heavy Outline',
    borderClass: 'border-4',
    roundedClass: 'rounded-md',
    shadowClass: 'shadow-none',
    hoverShadowClass: 'hover:shadow-sm',
    paddingClass: 'px-2 py-1.5',
    backgroundOpacity: 0.2,
    borderOpacity: 1.0
  },
  {
    id: 'outline-thin',
    name: 'Thin Outline',
    borderClass: 'border',
    roundedClass: 'rounded-lg',
    shadowClass: 'shadow-sm',
    hoverShadowClass: 'hover:shadow-md',
    paddingClass: 'px-2 py-1.5',
    backgroundOpacity: 0.5,
    borderOpacity: 0.9
  },
  {
    id: 'glow',
    name: 'Glow',
    borderClass: 'border-2',
    roundedClass: 'rounded-xl',
    shadowClass: 'shadow-lg',
    hoverShadowClass: 'hover:shadow-2xl',
    paddingClass: 'px-2.5 py-2',
    backgroundOpacity: 0.35,
    borderOpacity: 0.8
  },
  {
    id: 'washed',
    name: 'Washed',
    borderClass: 'border',
    roundedClass: 'rounded-lg',
    shadowClass: 'shadow-none',
    hoverShadowClass: 'hover:shadow-sm',
    paddingClass: 'px-2 py-1',
    backgroundOpacity: 0.1,
    borderOpacity: 0.2
  },
  {
    id: 'rich',
    name: 'Rich',
    borderClass: 'border-2',
    roundedClass: 'rounded-xl',
    shadowClass: 'shadow-md',
    hoverShadowClass: 'hover:shadow-xl',
    paddingClass: 'px-2.5 py-2',
    backgroundOpacity: 0.55,
    borderOpacity: 0.85
  },
  {
    id: 'crisp',
    name: 'Crisp',
    borderClass: 'border-2',
    roundedClass: 'rounded-sm',
    shadowClass: 'shadow-sm',
    hoverShadowClass: 'hover:shadow-md',
    paddingClass: 'px-2 py-1',
    backgroundOpacity: 0.45,
    borderOpacity: 0.95
  },
  {
    id: 'pastel',
    name: 'Pastel',
    borderClass: 'border',
    roundedClass: 'rounded-xl',
    shadowClass: 'shadow-sm',
    hoverShadowClass: 'hover:shadow-md',
    paddingClass: 'px-2.5 py-2',
    backgroundOpacity: 0.3,
    borderOpacity: 0.4
  },
  {
    id: 'bold-outline',
    name: 'Bold Outline',
    borderClass: 'border-4',
    roundedClass: 'rounded-lg',
    shadowClass: 'shadow-md',
    hoverShadowClass: 'hover:shadow-xl',
    paddingClass: 'px-2 py-1.5',
    backgroundOpacity: 0.3,
    borderOpacity: 1.0
  },
  {
    id: 'soft-glow',
    name: 'Soft Glow',
    borderClass: 'border',
    roundedClass: 'rounded-2xl',
    shadowClass: 'shadow-lg',
    hoverShadowClass: 'hover:shadow-2xl',
    paddingClass: 'px-2.5 py-2',
    backgroundOpacity: 0.3,
    borderOpacity: 0.5
  },
  {
    id: 'high-contrast',
    name: 'High Contrast',
    borderClass: 'border-4',
    roundedClass: 'rounded-md',
    shadowClass: 'shadow-lg',
    hoverShadowClass: 'hover:shadow-xl',
    paddingClass: 'px-2 py-1.5',
    backgroundOpacity: 0.2,
    borderOpacity: 1.0
  },
  {
    id: 'low-contrast',
    name: 'Low Contrast',
    borderClass: 'border',
    roundedClass: 'rounded-lg',
    shadowClass: 'shadow-sm',
    hoverShadowClass: 'hover:shadow-md',
    paddingClass: 'px-2 py-1',
    backgroundOpacity: 0.4,
    borderOpacity: 0.4
  },
  {
    id: 'ethereal',
    name: 'Ethereal',
    borderClass: 'border',
    roundedClass: 'rounded-2xl',
    shadowClass: 'shadow-sm',
    hoverShadowClass: 'hover:shadow-lg',
    paddingClass: 'px-2.5 py-2',
    backgroundOpacity: 0.2,
    borderOpacity: 0.3
  },
  {
    id: 'solid',
    name: 'Solid',
    borderClass: 'border-2',
    roundedClass: 'rounded-md',
    shadowClass: 'shadow-md',
    hoverShadowClass: 'hover:shadow-lg',
    paddingClass: 'px-2 py-1.5',
    backgroundOpacity: 0.3,
    borderOpacity: 0.95
  }
];

// Function to get a card style by ID
export function getCardStyle(styleId: string): CardStyle {
  const style = CARD_STYLES.find(s => s.id === styleId);
  return style || CARD_STYLES[0]; // Default to classic if not found
}

// Helper function to build card className from style
export function getCardClassName(style: CardStyle): string {
  return `group flex flex-col text-xs transition-colors ${style.borderClass} ${style.roundedClass} z-10 overflow-hidden ${style.paddingClass} h-full w-full ${style.shadowClass} ${style.hoverShadowClass} cursor-pointer`;
}

// Helper function to get border color with opacity
export function getBorderColorWithOpacity(color: string, isUnfinished: boolean, planCompleted: boolean, style: CardStyle): string {
  if (!color || style.borderOpacity === 0) return '#374151';
  
  // Make unplanned lessons more distinct with lower opacity
  const opacity = isUnfinished 
    ? Math.round(style.borderOpacity * 0.4 * 255).toString(16).padStart(2, '0') // Reduced from 0.5 to 0.4 for more distinction
    : planCompleted
    ? Math.round(style.borderOpacity * 0.8 * 255).toString(16).padStart(2, '0')
    : Math.round(style.borderOpacity * 0.67 * 255).toString(16).padStart(2, '0');
  
  return `${color}${opacity}`;
}


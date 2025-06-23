# Calendar Components

This directory contains modular calendar components that can be used throughout the application.

## Components

### WeekCalendar
A full-featured week view calendar component that displays lessons and events in a weekly grid format.

**Features:**
- Week navigation (previous/next week, go to today)
- Event display with time slots
- All-day event support
- Event modal for details
- Responsive design
- Custom scroll behavior

**Props:**
- `onAddEvent?: () => void` - Callback for add event button
- `className?: string` - Additional CSS classes

### MonthCalendar
A placeholder month view calendar component (implementation coming soon).

**Props:**
- `onAddEvent?: () => void` - Callback for add event button
- `className?: string` - Additional CSS classes

### ListCalendar
A placeholder list view calendar component (implementation coming soon).

**Props:**
- `onAddEvent?: () => void` - Callback for add event button
- `className?: string` - Additional CSS classes

## Usage

```tsx
import { WeekCalendar, MonthCalendar, ListCalendar } from '@/components/calendar';

// Basic usage
<WeekCalendar />

// With props
<WeekCalendar 
  onAddEvent={() => console.log('Add event')}
  className="h-full"
/>
```

## Architecture Benefits

1. **Separation of Concerns**: Each calendar view is a separate component
2. **Reusability**: Components can be used in different parts of the app
3. **Maintainability**: Easy to update individual views without affecting others
4. **Extensibility**: Easy to add new calendar views
5. **Custom Scroll Behavior**: Each component can implement its own scroll behavior
6. **Consistent API**: All components follow the same prop interface

## Future Enhancements

- Implement full MonthCalendar with grid layout
- Implement ListCalendar with chronological list
- Add drag-and-drop functionality
- Add event creation/editing modals
- Add calendar export functionality
- Add different time zone support 
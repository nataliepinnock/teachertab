"use client";

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { TimetableSlot } from "@/lib/db/schema";

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const TIME_SLOTS = [
  "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"
];

function timeToMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function getSlotGridPosition(slot: TimetableSlot, weekDates: Date[]) {
  // Find the column (day) index
  const dayIdx = DAYS_OF_WEEK.indexOf(slot.dayOfWeek);
  // Find the row (time) index
  const startRow = TIME_SLOTS.findIndex(t => t === slot.startTime);
  const endRow = TIME_SLOTS.findIndex(t => t === slot.endTime);
  // If not found, fallback to 0
  return {
    dayIdx: dayIdx === -1 ? 0 : dayIdx,
    startRow: startRow === -1 ? 0 : startRow,
    endRow: endRow === -1 ? startRow + 1 : endRow,
  };
}

function getWeekDates(weekNumber: number) {
  // Always start from the most recent Monday
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  // For 2-week cycle, add 7 days for week 2
  if (weekNumber === 2) {
    monday.setDate(monday.getDate() + 7);
  }
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

export function TimetableWeekCalendar({
  slots,
  currentWeek = 1,
}: {
  slots: TimetableSlot[];
  currentWeek?: number;
}) {
  // Get the dates for the current week
  const weekDates = useMemo(() => getWeekDates(currentWeek), [currentWeek]);

  // Filter slots for the current week
  const weekSlots = slots.filter(slot => slot.weekNumber === currentWeek);

  // Map slots to grid positions
  const slotGrid = weekSlots.map(slot => {
    const { dayIdx, startRow, endRow } = getSlotGridPosition(slot, weekDates);
    return { ...slot, dayIdx, startRow, endRow };
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="min-w-[800px] relative">
              {/* Header */}
              <div className="grid grid-cols-8 border-b-2 border-gray-300 bg-gray-100 sticky top-0 z-10">
                <div className="p-3 font-medium text-gray-700">Time</div>
                {DAYS_OF_WEEK.map(day => (
                  <div key={day} className="p-3 font-medium text-gray-700 text-center border-l border-gray-300">
                    {day}
                  </div>
                ))}
              </div>
              {/* Time grid */}
              <div className="relative">
                {/* Time labels */}
                <div className="absolute left-0 top-0 z-10 flex flex-col h-full">
                  {TIME_SLOTS.map((time, i) => (
                    <div key={time} className="h-20 flex items-start justify-end pr-2 text-xs text-gray-600 font-medium bg-gray-50 border-b border-gray-200 w-20">
                      {time}
                    </div>
                  ))}
                </div>
                {/* Slot blocks */}
                <div className="ml-20">
                  <div className="grid grid-cols-7" style={{ position: 'relative' }}>
                    {/* Empty grid for background */}
                    {Array.from({ length: 7 * TIME_SLOTS.length }).map((_, idx) => (
                      <div
                        key={idx}
                        className="border-b border-r border-gray-200 h-20"
                        style={{ gridColumn: (idx % 7) + 1, gridRow: Math.floor(idx / 7) + 1 }}
                      />
                    ))}
                    {/* Slot blocks */}
                    {slotGrid.map(slot => (
                      <div
                        key={slot.id}
                        className="absolute left-0 top-0 w-full"
                        style={{
                          gridColumn: slot.dayIdx + 1,
                          gridRowStart: slot.startRow + 1,
                          gridRowEnd: slot.endRow + 1,
                          zIndex: 2,
                          left: `calc(${(slot.dayIdx) * (100 / 7)}%)`,
                          top: `${slot.startRow * 80}px`,
                          width: `calc(100% / 7)`,
                          height: `${(slot.endRow - slot.startRow) * 80}px`,
                        }}
                      >
                        <div className="m-1 p-2 rounded border bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer group h-full flex flex-col justify-between">
                          <div className="flex items-center justify-between mb-1">
                            <div className="px-1 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              W{slot.weekNumber}
                            </div>
                          </div>
                          <div className="text-xs font-medium truncate">{slot.label}</div>
                          <div className="text-xs text-gray-600 flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {slot.startTime} - {slot.endTime}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
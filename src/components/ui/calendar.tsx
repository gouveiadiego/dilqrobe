
import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, MonthChangeEventHandler } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

// Define the extended calendar modes
type CalendarMode = "default" | "single" | "multiple" | "range" | "month";

// Define specific props for each mode to properly type the selection handlers
export type CalendarProps = Omit<React.ComponentProps<typeof DayPicker>, "mode" | "onSelect"> & {
  mode?: CalendarMode;
  // Include all possible onSelect handler types
  onSelect?: 
    | ((date: Date | undefined) => void) // For single mode 
    | ((dates: Date[] | undefined) => void) // For multiple mode
    | ((range: { from: Date; to?: Date } | undefined) => void); // For range mode
};

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  mode,
  onSelect,
  ...props
}: CalendarProps) {
  // Log month days for debugging
  React.useEffect(() => {
    if (props.month) {
      console.log("Calendar component - Current month:", props.month);
      const year = props.month.getFullYear();
      const month = props.month.getMonth();
      const lastDay = new Date(year, month + 1, 0).getDate();
      console.log(`Calendar component - Last day of month ${month+1}/${year}:`, lastDay);
    }
  }, [props.month]);

  // For month selection mode, we only need to display month view
  const isMonthSelectionMode = mode === "month";

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3 pointer-events-auto", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: cn(
          "text-sm font-medium",
          isMonthSelectionMode && "text-base"
        ),
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: () => <ChevronLeft className="h-4 w-4" />,
        IconRight: () => <ChevronRight className="h-4 w-4" />,
      }}
      // Configure mode and onSelect based on mode type
      {...(mode !== "month" 
        ? { 
            mode: mode as any, 
            onSelect: onSelect as any
          } 
        : {})}
      // If it's month selection mode, hide the day buttons
      hidden={isMonthSelectionMode ? true : undefined}
      // Additional props specific to month selection mode
      {...(isMonthSelectionMode ? {
        captionLayout: "dropdown",
        fromYear: new Date().getFullYear() - 2,
        toYear: new Date().getFullYear() + 2,
      } : {})}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };

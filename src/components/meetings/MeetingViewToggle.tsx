
import React from 'react';
import { Button } from "@/components/ui/button";
import { List, Calendar as CalendarIcon } from "lucide-react";

interface MeetingViewToggleProps {
  view: "list" | "calendar";
  onViewChange: (view: "list" | "calendar") => void;
}

export const MeetingViewToggle = ({ view, onViewChange }: MeetingViewToggleProps) => {
  return (
    <div className="flex space-x-2">
      <Button
        variant={view === "list" ? "default" : "outline"}
        size="icon"
        onClick={() => onViewChange("list")}
        className={view === "list" ? "bg-[#9b87f5] hover:bg-[#7E69AB]" : "border-gray-200 text-gray-700"}
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        variant={view === "calendar" ? "default" : "outline"}
        size="icon"
        onClick={() => onViewChange("calendar")}
        className={view === "calendar" ? "bg-[#9b87f5] hover:bg-[#7E69AB]" : "border-gray-200 text-gray-700"}
      >
        <CalendarIcon className="h-4 w-4" />
      </Button>
    </div>
  );
};

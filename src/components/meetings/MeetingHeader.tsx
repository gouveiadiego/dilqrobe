
import React from 'react';
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface MeetingHeaderProps {
  onNewMeeting: () => void;
}

export const MeetingHeader = ({ onNewMeeting }: MeetingHeaderProps) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
      <h2 className="text-2xl font-bold text-gray-800">Reuniões</h2>
      <Button 
        onClick={onNewMeeting}
        className="bg-[#496080] hover:bg-[#3a4c66] text-white"
      >
        <Plus className="h-4 w-4 mr-2" />
        Nova Reunião
      </Button>
    </div>
  );
};

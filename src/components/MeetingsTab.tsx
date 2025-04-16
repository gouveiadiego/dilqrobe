
import { MeetingManager } from "@/components/meetings/MeetingManager";

export function MeetingsTab() {
  return (
    <div className="animate-fade-in">
      <div className="mb-8 space-y-6">
        <div className="flex items-center">
          <h2 className="text-3xl font-bold text-[#9b87f5]">Reuniões</h2>
          <div className="h-1 flex-grow ml-4 bg-gradient-to-r from-[#9b87f5] to-[#33C3F0] rounded-full opacity-60"></div>
        </div>
        
        <MeetingManager />
      </div>
    </div>
  );
}

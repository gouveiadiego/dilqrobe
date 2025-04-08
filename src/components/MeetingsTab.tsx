
import { MeetingManager } from "@/components/meetings/MeetingManager";

export function MeetingsTab() {
  return (
    <div className="animate-fade-in">
      <div className="mb-8 space-y-6">
        <div className="flex items-center">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-dilq-accent to-dilq-teal bg-clip-text text-transparent">Reuniões</h2>
          <div className="h-1 flex-grow ml-4 bg-gradient-to-r from-dilq-accent to-dilq-teal rounded-full opacity-50"></div>
        </div>
        
        <MeetingManager />
      </div>
    </div>
  );
}

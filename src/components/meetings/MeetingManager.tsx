
import { useEffect, useState } from "react";
import { useMeetings, Meeting, NewMeeting } from "@/hooks/useMeetings";
import { MeetingForm } from "./MeetingForm";
import { MeetingList } from "./MeetingList";
import { MeetingCalendar } from "./MeetingCalendar";
import { Button } from "@/components/ui/button";
import { Plus, Calendar as CalendarIcon, List, Search, Filter } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";

export const MeetingManager = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | undefined>(undefined);
  const [view, setView] = useState<"list" | "calendar">("list");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "scheduled" | "completed" | "canceled">("all");

  const { meetings, isLoading, addMeeting, updateMeeting, deleteMeeting, updateMeetingStatus } = useMeetings();

  // Filter meetings based on search query and status
  const filteredMeetings = meetings.filter(meeting => {
    // Status filter
    if (statusFilter !== "all" && meeting.status !== statusFilter) {
      return false;
    }
    
    // Date filter
    if (selectedDate) {
      const meetingDate = new Date(meeting.meeting_date);
      if (
        meetingDate.getDate() !== selectedDate.getDate() ||
        meetingDate.getMonth() !== selectedDate.getMonth() ||
        meetingDate.getFullYear() !== selectedDate.getFullYear()
      ) {
        return false;
      }
    }
    
    // Search query filter
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      meeting.title.toLowerCase().includes(query) ||
      (meeting.description?.toLowerCase().includes(query) || false) ||
      (meeting.client?.name.toLowerCase().includes(query) || false) ||
      (meeting.location?.toLowerCase().includes(query) || false)
    );
  });

  const handleAddMeeting = (meeting: NewMeeting) => {
    addMeeting(meeting);
    setIsFormOpen(false);
  };

  const handleEditMeeting = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setIsFormOpen(true);
  };

  const handleUpdateMeeting = (meeting: NewMeeting) => {
    if (selectedMeeting) {
      updateMeeting({
        id: selectedMeeting.id,
        updates: meeting
      });
      setSelectedMeeting(undefined);
      setIsFormOpen(false);
    }
  };

  const handleCloseForm = () => {
    setSelectedMeeting(undefined);
    setIsFormOpen(false);
  };

  const handleDeleteMeeting = (id: string) => {
    deleteMeeting(id);
  };

  const handleStatusChange = (id: string, status: Meeting["status"]) => {
    updateMeetingStatus({ id, status });
  };

  const handleDateSelect = (date: Date) => {
    // Toggle selection if clicking on the same date
    if (selectedDate && date.getTime() === selectedDate.getTime()) {
      setSelectedDate(null);
    } else {
      setSelectedDate(date);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setSelectedDate(null);
  };

  const hasActiveFilters = searchQuery || statusFilter !== "all" || selectedDate;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <h2 className="text-2xl font-bold text-gray-800">Reuniões</h2>
        <Button 
          onClick={() => setIsFormOpen(true)}
          className="bg-[#496080] hover:bg-[#3a4c66] text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Reunião
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <Card className="p-4 border-gray-200">
            <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
              <div className="relative flex-1 w-full max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar reuniões..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-gray-200 focus:border-[#9b87f5] focus:ring-[#9b87f5]/20"
                />
              </div>

              <div className="flex flex-wrap gap-3 items-center">
                <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                  <SelectTrigger className="w-[160px] border-gray-200 focus:border-[#9b87f5] focus:ring-[#9b87f5]/20">
                    <Filter className="h-4 w-4 mr-2 text-gray-500" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="scheduled">Agendadas</SelectItem>
                    <SelectItem value="completed">Concluídas</SelectItem>
                    <SelectItem value="canceled">Canceladas</SelectItem>
                  </SelectContent>
                </Select>

                {hasActiveFilters && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearFilters}
                    className="text-[#9b87f5] hover:text-[#7E69AB] hover:bg-[#9b87f5]/10"
                  >
                    Limpar filtros
                  </Button>
                )}

                <div className="flex space-x-2">
                  <Button
                    variant={view === "list" ? "default" : "outline"}
                    size="icon"
                    onClick={() => setView("list")}
                    className={view === "list" ? "bg-[#9b87f5] hover:bg-[#7E69AB]" : "border-gray-200 text-gray-700"}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={view === "calendar" ? "default" : "outline"}
                    size="icon"
                    onClick={() => setView("calendar")}
                    className={view === "calendar" ? "bg-[#9b87f5] hover:bg-[#7E69AB]" : "border-gray-200 text-gray-700"}
                  >
                    <CalendarIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {selectedDate && (
              <div className="mt-3 p-2 bg-[#9b87f5]/10 rounded-md flex justify-between items-center">
                <div className="text-sm flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-1 text-[#9b87f5]" />
                  <span>Filtrando por data: <strong>{selectedDate.toLocaleDateString()}</strong></span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSelectedDate(null)}
                  className="text-xs h-7 px-2 text-[#9b87f5] hover:text-[#7E69AB] hover:bg-[#9b87f5]/10"
                >
                  Remover filtro
                </Button>
              </div>
            )}
          </Card>

          {view === "list" ? (
            <MeetingList
              meetings={filteredMeetings}
              onEdit={handleEditMeeting}
              onDelete={handleDeleteMeeting}
              onStatusChange={handleStatusChange}
              selectedDate={selectedDate}
            />
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              {/* Calendar view implementation here */}
              <p className="text-center text-gray-500">Visualização de calendário em desenvolvimento</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <MeetingCalendar
            meetings={meetings}
            onDateSelect={handleDateSelect}
            selectedDate={selectedDate}
          />

          <div className="p-4 bg-[#9b87f5]/10 border border-[#9b87f5]/20 rounded-lg text-[#6E59A5]">
            <h3 className="font-medium mb-2">Próximas reuniões</h3>
            <div className="space-y-2">
              {isLoading ? (
                <p className="text-sm text-gray-500">Carregando...</p>
              ) : meetings.filter(m => m.status === "scheduled").length === 0 ? (
                <p className="text-sm text-gray-500">Nenhuma reunião agendada</p>
              ) : (
                meetings
                  .filter(m => m.status === "scheduled")
                  .sort((a, b) => new Date(a.meeting_date).getTime() - new Date(b.meeting_date).getTime())
                  .slice(0, 3)
                  .map(meeting => (
                    <div key={meeting.id} className="text-sm p-2 bg-white rounded border border-[#9b87f5]/20">
                      <div className="font-medium">{meeting.title}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(meeting.meeting_date).toLocaleDateString()} -{" "}
                        {new Date(meeting.meeting_date).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </div>
                      {meeting.client && (
                        <div className="text-xs text-gray-500">
                          Cliente: {meeting.client.name}
                        </div>
                      )}
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedMeeting ? "Editar Reunião" : "Nova Reunião"}
            </DialogTitle>
          </DialogHeader>
          <MeetingForm
            onSubmit={selectedMeeting ? handleUpdateMeeting : handleAddMeeting}
            onCancel={handleCloseForm}
            initialData={selectedMeeting}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

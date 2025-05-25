
import { useState } from "react";
import { useMeetings, Meeting, NewMeeting } from "@/hooks/useMeetings";
import { usePagination } from "@/hooks/usePagination";
import { MeetingForm } from "./MeetingForm";
import { MeetingList } from "./MeetingList";
import { MeetingHeader } from "./MeetingHeader";
import { MeetingFilters } from "./MeetingFilters";
import { MeetingViewToggle } from "./MeetingViewToggle";
import { MeetingSidebar } from "./MeetingSidebar";
import { PaginationControls } from "@/components/ui/pagination-controls";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export const MeetingManager = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | undefined>(undefined);
  const [view, setView] = useState<"list" | "calendar">("list");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "scheduled" | "completed" | "canceled">("all");

  const { meetings, isLoading, addMeeting, updateMeeting, deleteMeeting, updateMeetingStatus } = useMeetings({
    searchQuery: searchQuery || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    dateFrom: selectedDate ? selectedDate.toISOString().split('T')[0] : undefined,
    dateTo: selectedDate ? selectedDate.toISOString().split('T')[0] : undefined,
  });

  const {
    paginatedData: paginatedMeetings,
    currentPage,
    totalPages,
    goToPage,
    hasNextPage,
    hasPrevPage
  } = usePagination({ data: meetings, itemsPerPage: 10 });

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

  const hasActiveFilters = Boolean(searchQuery || statusFilter !== "all" || selectedDate);

  if (isLoading) {
    return <LoadingSpinner size="lg" text="Carregando reuniões..." className="h-64" />;
  }

  return (
    <div className="space-y-6">
      <MeetingHeader onNewMeeting={() => setIsFormOpen(true)} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <Card className="p-4 border-gray-200">
            <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
              <MeetingFilters
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                statusFilter={statusFilter}
                onStatusFilterChange={(value: any) => setStatusFilter(value)}
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
                onClearFilters={clearFilters}
                hasActiveFilters={hasActiveFilters}
              />
              <MeetingViewToggle view={view} onViewChange={setView} />
            </div>
          </Card>

          {view === "list" ? (
            <div className="space-y-4">
              <MeetingList
                meetings={paginatedMeetings}
                onEdit={handleEditMeeting}
                onDelete={handleDeleteMeeting}
                onStatusChange={handleStatusChange}
                selectedDate={selectedDate}
              />
              
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={goToPage}
                hasNextPage={hasNextPage}
                hasPrevPage={hasPrevPage}
                className="mt-6"
              />
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <p className="text-center text-gray-500">Visualização de calendário em desenvolvimento</p>
            </div>
          )}
        </div>

        <MeetingSidebar
          meetings={meetings}
          onDateSelect={handleDateSelect}
          selectedDate={selectedDate}
          isLoading={isLoading}
        />
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

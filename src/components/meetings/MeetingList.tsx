import { useState } from "react";
import { format, isSameDay, parseISO, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Meeting } from "@/hooks/useMeetings";
import {
  Calendar,
  CheckCircle,
  Clock,
  Edit,
  MapPin,
  MoreHorizontal,
  Trash,
  User,
  XCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TextEllipsis } from "../ui/text-ellipsis";

interface MeetingListProps {
  meetings: Meeting[];
  onEdit: (meeting: Meeting) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: Meeting["status"]) => void;
  selectedDate?: Date | null;
}

export const MeetingList = ({
  meetings,
  onEdit,
  onDelete,
  onStatusChange,
  selectedDate,
}: MeetingListProps) => {
  const [meetingToDelete, setMeetingToDelete] = useState<string | null>(null);

  const filteredMeetings = selectedDate
    ? meetings.filter((meeting) =>
        isSameDay(parseISO(meeting.meeting_date), selectedDate)
      )
    : meetings;

  const groupedMeetings: { [key: string]: Meeting[] } = {};
  
  filteredMeetings.forEach((meeting) => {
    const dateKey = format(parseISO(meeting.meeting_date), "yyyy-MM-dd");
    if (!groupedMeetings[dateKey]) {
      groupedMeetings[dateKey] = [];
    }
    groupedMeetings[dateKey].push(meeting);
  });

  const sortedDates = Object.keys(groupedMeetings).sort((a, b) => {
    return new Date(a).getTime() - new Date(b).getTime();
  });

  const getStatusBadge = (status: Meeting["status"]) => {
    switch (status) {
      case "scheduled":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Agendada
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Concluída
          </Badge>
        );
      case "canceled":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Cancelada
          </Badge>
        );
      default:
        return null;
    }
  };

  const handleCloseDeleteDialog = () => {
    setMeetingToDelete(null);
  };

  const handleConfirmDelete = () => {
    if (meetingToDelete) {
      onDelete(meetingToDelete);
      setMeetingToDelete(null);
    }
  };

  if (filteredMeetings.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/20 rounded-lg">
        <Calendar className="h-12 w-12 mx-auto text-gray-400" />
        <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100">
          Nenhuma reunião encontrada
        </h3>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          {selectedDate
            ? "Não há reuniões agendadas para esta data."
            : "Comece agendando sua primeira reunião."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {sortedDates.map((dateKey) => (
        <div key={dateKey} className="bg-white dark:bg-gray-800/20 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="p-4 bg-gray-50 dark:bg-gray-800/40 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>
                {format(new Date(dateKey), "EEEE, d 'de' MMMM 'de' yyyy", {
                  locale: ptBR,
                })}
              </span>
            </h3>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {groupedMeetings[dateKey]
              .sort((a, b) => 
                new Date(a.meeting_date).getTime() - new Date(b.meeting_date).getTime()
              )
              .map((meeting) => (
                <div
                  key={meeting.id}
                  className={`p-4 transition-colors ${
                    meeting.status === "canceled" 
                      ? "bg-gray-50/50 dark:bg-gray-900/30" 
                      : meeting.status === "completed"
                      ? "bg-green-50/20 dark:bg-green-900/10"
                      : isPast(parseISO(meeting.meeting_date)) 
                      ? "bg-yellow-50/20 dark:bg-yellow-900/10" 
                      : ""
                  }`}
                >
                  <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">
                          <TextEllipsis 
                            text={meeting.title}
                            maxLength={60}
                            className="max-w-[400px]"
                          />
                        </h4>
                        {getStatusBadge(meeting.status)}
                      </div>
                      
                      <div className="text-sm text-gray-500 flex flex-col gap-1">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          <span>
                            {format(parseISO(meeting.meeting_date), "HH:mm", {
                              locale: ptBR,
                            })}{" "}
                            - Duração: {meeting.duration} minutos
                          </span>
                        </div>
                        
                        {meeting.client && (
                          <div className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5" />
                            <span>Cliente: 
                              <TextEllipsis 
                                text={meeting.client.name}
                                maxLength={40}
                                className="inline-block max-w-[200px] ml-1"
                              />
                            </span>
                          </div>
                        )}
                        
                        {meeting.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            <TextEllipsis 
                              text={meeting.location}
                              maxLength={50}
                              className="max-w-[300px]"
                            />
                          </div>
                        )}
                        
                        {meeting.description && (
                          <div className="mt-1 text-gray-600 dark:text-gray-300">
                            <TextEllipsis 
                              text={meeting.description}
                              maxLength={100}
                              className="max-w-[500px]"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-end gap-2">
                      {meeting.status === "scheduled" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800 hover:border-green-300"
                          onClick={() => onStatusChange(meeting.id, "completed")}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Concluir
                        </Button>
                      )}
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEdit(meeting)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          
                          {meeting.status === "scheduled" ? (
                            <DropdownMenuItem 
                              onClick={() => onStatusChange(meeting.id, "canceled")}
                              className="text-red-600"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Cancelar
                            </DropdownMenuItem>
                          ) : meeting.status === "canceled" ? (
                            <DropdownMenuItem 
                              onClick={() => onStatusChange(meeting.id, "scheduled")}
                              className="text-blue-600"
                            >
                              <Calendar className="h-4 w-4 mr-2" />
                              Reagendar
                            </DropdownMenuItem>
                          ) : null}
                          
                          <DropdownMenuItem 
                            onClick={() => setMeetingToDelete(meeting.id)}
                            className="text-red-600"
                          >
                            <Trash className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}

      <AlertDialog open={!!meetingToDelete} onOpenChange={handleCloseDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir reunião</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta reunião? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

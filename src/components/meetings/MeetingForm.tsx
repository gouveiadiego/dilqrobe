
import { useState, useEffect } from "react";
import { useClients } from "@/hooks/useClients";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Meeting, NewMeeting } from "@/hooks/useMeetings";
import { CalendarIcon, Clock } from "lucide-react";

interface MeetingFormProps {
  onSubmit: (meeting: NewMeeting) => void;
  onCancel: () => void;
  initialData?: Meeting;
}

export const MeetingForm = ({ onSubmit, onCancel, initialData }: MeetingFormProps) => {
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [clientId, setClientId] = useState<string | undefined>(initialData?.client_id || undefined);
  const [meetingDate, setMeetingDate] = useState<Date | undefined>(
    initialData?.meeting_date ? new Date(initialData.meeting_date) : undefined
  );
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [time, setTime] = useState(
    initialData?.meeting_date 
      ? format(new Date(initialData.meeting_date), "HH:mm") 
      : "09:00"
  );
  const [duration, setDuration] = useState(initialData?.duration?.toString() || "60");
  const [location, setLocation] = useState(initialData?.location || "");
  const [notes, setNotes] = useState(initialData?.notes || "");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const { clients, isLoading: clientsLoading } = useClients();

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!title.trim()) {
      newErrors.title = "Título é obrigatório";
    }
    
    if (!meetingDate) {
      newErrors.meetingDate = "Data da reunião é obrigatória";
    }
    
    if (!time) {
      newErrors.time = "Horário é obrigatório";
    }
    
    if (!duration || isNaN(Number(duration)) || Number(duration) <= 0) {
      newErrors.duration = "Duração válida é obrigatória";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    // Combine date and time
    const dateTime = new Date(meetingDate!);
    const [hours, minutes] = time.split(":").map(Number);
    dateTime.setHours(hours, minutes, 0, 0);
    
    const meetingData: NewMeeting = {
      title,
      description,
      client_id: clientId || null,
      meeting_date: dateTime.toISOString(),
      duration: Number(duration),
      location,
      notes,
      status: initialData?.status || "scheduled"
    };
    
    onSubmit(meetingData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-1">
          Título da reunião <span className="text-red-500">*</span>
        </label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: Apresentação de proposta"
          className={errors.title ? "border-red-500" : ""}
        />
        {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
      </div>

      <div>
        <label htmlFor="client" className="block text-sm font-medium mb-1">
          Cliente
        </label>
        <Select value={clientId} onValueChange={setClientId}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione um cliente (opcional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Nenhum cliente específico</SelectItem>
            {!clientsLoading &&
              clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Data <span className="text-red-500">*</span>
          </label>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={`w-full justify-start text-left font-normal ${
                  !meetingDate && "text-muted-foreground"
                } ${errors.meetingDate ? "border-red-500" : ""}`}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {meetingDate ? (
                  format(meetingDate, "PPP", { locale: ptBR })
                ) : (
                  <span>Selecione uma data</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={meetingDate}
                onSelect={(date) => {
                  setMeetingDate(date);
                  setCalendarOpen(false);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {errors.meetingDate && (
            <p className="text-red-500 text-xs mt-1">{errors.meetingDate}</p>
          )}
        </div>

        <div>
          <label htmlFor="time" className="block text-sm font-medium mb-1">
            Horário <span className="text-red-500">*</span>
          </label>
          <div className="flex">
            <div className="relative flex-1">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className={`pl-10 ${errors.time ? "border-red-500" : ""}`}
              />
            </div>
          </div>
          {errors.time && <p className="text-red-500 text-xs mt-1">{errors.time}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="duration" className="block text-sm font-medium mb-1">
          Duração (minutos) <span className="text-red-500">*</span>
        </label>
        <Input
          id="duration"
          type="number"
          min="1"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          placeholder="60"
          className={errors.duration ? "border-red-500" : ""}
        />
        {errors.duration && <p className="text-red-500 text-xs mt-1">{errors.duration}</p>}
      </div>

      <div>
        <label htmlFor="location" className="block text-sm font-medium mb-1">
          Local / Link
        </label>
        <Input
          id="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Ex: Sala de reunião ou link de videoconferência"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-1">
          Descrição
        </label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Insira os detalhes da reunião"
          rows={3}
        />
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium mb-1">
          Notas
        </label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anotações adicionais"
          rows={3}
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          {initialData ? "Atualizar Reunião" : "Agendar Reunião"}
        </Button>
      </div>
    </form>
  );
};

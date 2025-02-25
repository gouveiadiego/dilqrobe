
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type HabitFormProps = {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: {
    id: string;
    title: string;
    description?: string;
    schedule_days: string[];
    schedule_time?: string;
  };
};

export function HabitForm({ onSuccess, onCancel, initialData }: HabitFormProps) {
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    description: initialData?.description || "",
    schedule_days: initialData?.schedule_days || [],
    schedule_time: initialData?.schedule_time || "",
  });

  const daysOfWeek = [
    { id: "sunday", label: "Domingo" },
    { id: "monday", label: "Segunda" },
    { id: "tuesday", label: "Terça" },
    { id: "wednesday", label: "Quarta" },
    { id: "thursday", label: "Quinta" },
    { id: "friday", label: "Sexta" },
    { id: "saturday", label: "Sábado" },
  ];

  const handleDayToggle = (day: string) => {
    setFormData((prev) => ({
      ...prev,
      schedule_days: prev.schedule_days.includes(day)
        ? prev.schedule_days.filter((d) => d !== day)
        : [...prev.schedule_days, day],
    }));
  };

  const handleSubmit = async () => {
    try {
      if (!formData.title) {
        toast.error("Por favor, preencha o título do hábito");
        return;
      }

      if (formData.schedule_days.length === 0) {
        toast.error("Por favor, selecione pelo menos um dia da semana");
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        toast.error("Usuário não autenticado");
        return;
      }

      if (initialData?.id) {
        // Update existing habit
        const { error } = await supabase
          .from("habits")
          .update({
            title: formData.title,
            description: formData.description,
            schedule_days: formData.schedule_days,
            schedule_time: formData.schedule_time || null,
          })
          .eq("id", initialData.id);

        if (error) throw error;
        toast.success("Hábito atualizado com sucesso!");
      } else {
        // Create new habit
        const { error } = await supabase.from("habits").insert({
          user_id: session.user.id,
          title: formData.title,
          description: formData.description,
          schedule_days: formData.schedule_days,
          schedule_time: formData.schedule_time || null,
        });

        if (error) throw error;
        toast.success("Hábito criado com sucesso!");
      }

      onSuccess();
    } catch (error) {
      console.error("Erro ao salvar hábito:", error);
      toast.error("Erro ao salvar hábito");
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="title">Título do Hábito</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
          placeholder="Ex: Meditar"
        />
      </div>

      <div>
        <Label htmlFor="description">Descrição (opcional)</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="Descreva seu hábito..."
        />
      </div>

      <div>
        <Label>Dias da Semana</Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
          {daysOfWeek.map((day) => (
            <Button
              key={day.id}
              type="button"
              variant={formData.schedule_days.includes(day.id) ? "default" : "outline"}
              onClick={() => handleDayToggle(day.id)}
              className="w-full"
            >
              {day.label}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="time">Horário (opcional)</Label>
        <Input
          id="time"
          type="time"
          value={formData.schedule_time}
          onChange={(e) => setFormData((prev) => ({ ...prev, schedule_time: e.target.value }))}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit}>
          {initialData ? "Atualizar" : "Criar"} Hábito
        </Button>
      </div>
    </div>
  );
}

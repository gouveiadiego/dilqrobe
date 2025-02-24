
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function ProjectTasks() {
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['project-tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_tasks')
        .select(`
          *,
          project_companies (
            name
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  if (isLoading) return <div>Carregando...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Tarefas do Projeto</h3>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Tarefa
        </Button>
      </div>

      <div className="space-y-4">
        {tasks.map((task) => (
          <div key={task.id} className="p-4 border rounded-lg">
            <h4 className="font-medium">{task.title}</h4>
            <p className="text-sm text-gray-600">{task.description}</p>
            <p className="text-sm">Empresa: {task.project_companies?.name}</p>
            <p className="text-sm">Status: {
              task.status === 'pending' ? 'Pendente' :
              task.status === 'in_progress' ? 'Em Andamento' :
              task.status === 'completed' ? 'Concluída' :
              task.status
            }</p>
          </div>
        ))}
      </div>
    </div>
  );
}


import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Plus, PenSquare, Trash2, Check, AlertCircle, Copy } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ContentTask {
  id: string;
  title: string;
  content: string;
  type: string;
  status: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

interface CompanyContentTasksProps {
  companyId: string;
  companyName: string;
}

export function CompanyContentTasks({ companyId, companyName }: CompanyContentTasksProps) {
  const [tasks, setTasks] = useState<ContentTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<ContentTask | null>(null);
  
  const [newTask, setNewTask] = useState({
    title: "",
    content: "",
    type: "general",
    status: "pending"
  });

  const contentTypes = [
    { value: "general", label: "Geral" },
    { value: "video_copy", label: "Copy para Vídeo" },
    { value: "social_media", label: "Post para Redes Sociais" },
    { value: "email", label: "Email Marketing" },
    { value: "ad_copy", label: "Copy para Anúncio" },
    { value: "blog", label: "Artigo de Blog" }
  ];

  const statusOptions = [
    { value: "pending", label: "Pendente" },
    { value: "in_progress", label: "Em Andamento" },
    { value: "review", label: "Em Revisão" },
    { value: "approved", label: "Aprovado" },
    { value: "completed", label: "Concluído" }
  ];

  useEffect(() => {
    fetchTasks();
  }, [companyId]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("company_content_tasks")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error("Error fetching content tasks:", error);
      toast.error("Erro ao buscar tarefas de conteúdo");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async () => {
    try {
      if (!newTask.title.trim()) {
        toast.error("O título é obrigatório");
        return;
      }
      
      if (!newTask.content.trim()) {
        toast.error("O conteúdo é obrigatório");
        return;
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Usuário não autenticado");
        return;
      }
      
      const { data, error } = await supabase
        .from("company_content_tasks")
        .insert({
          company_id: companyId,
          user_id: user.id,
          title: newTask.title,
          content: newTask.content,
          type: newTask.type,
          status: newTask.status
        })
        .select();

      if (error) throw error;
      
      toast.success("Conteúdo adicionado com sucesso");
      setTasks([...(data || []), ...tasks]);
      setIsAddDialogOpen(false);
      setNewTask({
        title: "",
        content: "",
        type: "general",
        status: "pending"
      });
      fetchTasks();
    } catch (error) {
      console.error("Error adding content task:", error);
      toast.error("Erro ao adicionar conteúdo");
    }
  };

  const handleUpdateTask = async () => {
    try {
      if (!currentTask) return;
      
      const { error } = await supabase
        .from("company_content_tasks")
        .update({
          title: currentTask.title,
          content: currentTask.content,
          type: currentTask.type,
          status: currentTask.status,
          updated_at: new Date().toISOString()
        })
        .eq("id", currentTask.id);

      if (error) throw error;
      
      toast.success("Conteúdo atualizado com sucesso");
      setIsEditDialogOpen(false);
      fetchTasks();
    } catch (error) {
      console.error("Error updating content task:", error);
      toast.error("Erro ao atualizar conteúdo");
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      if (!confirm("Tem certeza que deseja excluir este conteúdo?")) return;
      
      const { error } = await supabase
        .from("company_content_tasks")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      toast.success("Conteúdo excluído com sucesso");
      setTasks(tasks.filter(task => task.id !== id));
    } catch (error) {
      console.error("Error deleting content task:", error);
      toast.error("Erro ao excluir conteúdo");
    }
  };

  const toggleTaskCompletion = async (task: ContentTask) => {
    try {
      const newCompletedState = !task.completed;
      
      const { error } = await supabase
        .from("company_content_tasks")
        .update({
          completed: newCompletedState,
          status: newCompletedState ? "completed" : task.status,
          updated_at: new Date().toISOString()
        })
        .eq("id", task.id);

      if (error) throw error;
      
      toast.success(newCompletedState ? "Conteúdo marcado como concluído" : "Conteúdo marcado como não concluído");
      fetchTasks();
    } catch (error) {
      console.error("Error toggling content task completion:", error);
      toast.error("Erro ao atualizar status de conclusão");
    }
  };

  const duplicateTask = async (task: ContentTask) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Usuário não autenticado");
        return;
      }
      
      const { data, error } = await supabase
        .from("company_content_tasks")
        .insert({
          company_id: companyId,
          user_id: user.id,
          title: `${task.title} (Cópia)`,
          content: task.content,
          type: task.type,
          status: "pending",
          completed: false
        })
        .select();

      if (error) throw error;
      
      toast.success("Conteúdo duplicado com sucesso");
      fetchTasks();
    } catch (error) {
      console.error("Error duplicating content task:", error);
      toast.error("Erro ao duplicar conteúdo");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Conteúdo copiado para a área de transferência");
  };

  const getTypeLabel = (type: string) => {
    const found = contentTypes.find(t => t.value === type);
    return found ? found.label : type;
  };

  const getStatusLabel = (status: string) => {
    const found = statusOptions.find(s => s.value === status);
    return found ? found.label : status;
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'pending': return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case 'in_progress': return "bg-blue-100 text-blue-800 border-blue-200";
      case 'review': return "bg-purple-100 text-purple-800 border-purple-200";
      case 'approved': return "bg-green-100 text-green-800 border-green-200";
      case 'completed': return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Conteúdos de Marketing para {companyName}</h3>
        <Button 
          onClick={() => setIsAddDialogOpen(true)}
          className="flex items-center"
          variant="default"
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Conteúdo
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-10 border border-dashed rounded-md">
          <AlertCircle className="h-10 w-10 mx-auto mb-3 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-500">Nenhum conteúdo encontrado</h3>
          <p className="text-gray-400 mt-1">Clique em "Novo Conteúdo" para adicionar</p>
        </div>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Concluído</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                <TableRow 
                  key={task.id}
                  className={task.completed ? "bg-gray-50" : ""}
                >
                  <TableCell>
                    <Checkbox 
                      checked={task.completed}
                      onCheckedChange={() => toggleTaskCompletion(task)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    {task.title}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {getTypeLabel(task.type)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusClass(task.status)}>
                      {getStatusLabel(task.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(task.created_at), "dd/MM/yyyy", { locale: ptBR })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => {
                          setCurrentTask(task);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <PenSquare className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => duplicateTask(task)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add New Content Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Conteúdo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto py-2">
            <div>
              <label className="block text-sm font-medium mb-1">Título</label>
              <Input 
                value={newTask.title}
                onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                placeholder="Título do conteúdo"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tipo de Conteúdo</label>
                <Select 
                  value={newTask.type}
                  onValueChange={(value) => setNewTask({...newTask, type: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {contentTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <Select 
                  value={newTask.status}
                  onValueChange={(value) => setNewTask({...newTask, status: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Conteúdo</label>
              <Textarea 
                value={newTask.content}
                onChange={(e) => setNewTask({...newTask, content: e.target.value})}
                placeholder="Digite o conteúdo aqui..."
                className="min-h-[200px]"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddTask}>
                <Check className="mr-2 h-4 w-4" />
                Adicionar Conteúdo
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Content Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Editar Conteúdo</DialogTitle>
          </DialogHeader>
          {currentTask && (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto py-2">
              <div>
                <label className="block text-sm font-medium mb-1">Título</label>
                <Input 
                  value={currentTask.title}
                  onChange={(e) => setCurrentTask({...currentTask, title: e.target.value})}
                  placeholder="Título do conteúdo"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tipo de Conteúdo</label>
                  <Select 
                    value={currentTask.type}
                    onValueChange={(value) => setCurrentTask({...currentTask, type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {contentTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <Select 
                    value={currentTask.status}
                    onValueChange={(value) => setCurrentTask({...currentTask, status: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <label className="block text-sm font-medium">Conteúdo</label>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 text-xs"
                    onClick={() => copyToClipboard(currentTask.content)}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copiar
                  </Button>
                </div>
                <Textarea 
                  value={currentTask.content}
                  onChange={(e) => setCurrentTask({...currentTask, content: e.target.value})}
                  placeholder="Digite o conteúdo aqui..."
                  className="min-h-[200px]"
                />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Checkbox 
                  id="completed"
                  checked={currentTask.completed}
                  onCheckedChange={(checked) => setCurrentTask({
                    ...currentTask, 
                    completed: checked as boolean,
                    status: checked ? "completed" : currentTask.status
                  })}
                />
                <label 
                  htmlFor="completed" 
                  className="text-sm font-medium cursor-pointer"
                >
                  Marcar como concluído
                </label>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleUpdateTask}>
                  <Check className="mr-2 h-4 w-4" />
                  Salvar Alterações
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

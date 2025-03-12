
import { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Check, X, Calendar } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type RunningRecord = {
  id: string;
  challenge_id: string;
  user_id: string;
  distance: number;
  duration: number | null;
  date: string;
  created_at: string;
  notes: string | null;
};

interface RunningRecordsListProps {
  records: RunningRecord[];
  onUpdate: () => void;
}

export function RunningRecordsList({ records, onUpdate }: RunningRecordsListProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<RunningRecord | null>(null);
  const [editedRecord, setEditedRecord] = useState({
    distance: "",
    duration: "",
    date: "",
    notes: ""
  });

  const handleEditClick = (record: RunningRecord) => {
    setCurrentRecord(record);
    setEditedRecord({
      distance: record.distance.toString(),
      duration: record.duration ? record.duration.toString() : "",
      date: record.date,
      notes: record.notes || ""
    });
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (record: RunningRecord) => {
    setCurrentRecord(record);
    setDeleteDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!currentRecord) return;
    
    try {
      const { error } = await supabase
        .from('running_records')
        .update({
          distance: parseFloat(editedRecord.distance),
          duration: editedRecord.duration ? parseInt(editedRecord.duration) : null,
          date: editedRecord.date,
          notes: editedRecord.notes
        })
        .eq('id', currentRecord.id);

      if (error) {
        console.error("Error updating record:", error);
        toast.error("Erro ao atualizar registro");
        return;
      }

      // Update challenge rankings
      const { error: rankingError } = await supabase.rpc('update_challenge_rankings', {
        challenge_id: currentRecord.challenge_id
      });

      if (rankingError) {
        console.error("Error updating rankings:", rankingError);
        toast.error("Erro ao atualizar ranking");
      }

      toast.success("Registro atualizado com sucesso!");
      setEditDialogOpen(false);
      onUpdate();
    } catch (error) {
      console.error("Error in handleUpdate:", error);
      toast.error("Erro ao atualizar registro");
    }
  };

  const handleDelete = async () => {
    if (!currentRecord) return;
    
    try {
      const { error } = await supabase
        .from('running_records')
        .delete()
        .eq('id', currentRecord.id);

      if (error) {
        console.error("Error deleting record:", error);
        toast.error("Erro ao excluir registro");
        return;
      }

      // Update challenge rankings after deletion
      const { error: rankingError } = await supabase.rpc('update_challenge_rankings', {
        challenge_id: currentRecord.challenge_id
      });

      if (rankingError) {
        console.error("Error updating rankings:", rankingError);
        toast.error("Erro ao atualizar ranking");
      }

      toast.success("Registro excluído com sucesso!");
      setDeleteDialogOpen(false);
      onUpdate();
    } catch (error) {
      console.error("Error in handleDelete:", error);
      toast.error("Erro ao excluir registro");
    }
  };

  // Format pace (min/km)
  const formatPace = (distance: number, duration: number | null) => {
    if (!duration || !distance || distance === 0) return "-";
    
    const paceInMinutes = duration / distance;
    const minutes = Math.floor(paceInMinutes);
    const seconds = Math.floor((paceInMinutes - minutes) * 60);
    
    return `${minutes}:${seconds.toString().padStart(2, '0')} min/km`;
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-indigo-800 flex items-center">
        <Calendar className="h-5 w-5 mr-2 text-indigo-600" />
        Registros de Corridas
      </h3>
      
      {records.length === 0 ? (
        <div className="text-center py-8 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-100 shadow-sm">
          <p className="text-gray-500">Nenhum registro de corrida encontrado</p>
        </div>
      ) : (
        <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Distância (km)</TableHead>
                <TableHead>Duração (min)</TableHead>
                <TableHead>Ritmo</TableHead>
                <TableHead>Notas</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{format(new Date(record.date), 'dd/MM/yyyy')}</TableCell>
                  <TableCell>{record.distance.toFixed(2)}</TableCell>
                  <TableCell>{record.duration || '-'}</TableCell>
                  <TableCell>{formatPace(record.distance, record.duration)}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{record.notes || '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                        onClick={() => handleEditClick(record)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDeleteClick(record)}
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

      {/* Edit Record Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-white/95 backdrop-blur-xl border border-indigo-100 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-indigo-800 flex items-center">
              <Edit className="mr-2 h-5 w-5 text-indigo-500" />
              Editar Registro de Corrida
            </DialogTitle>
            <DialogDescription className="text-indigo-600">
              Atualize os detalhes da sua corrida
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="distance">Distância (km)</Label>
              <Input
                id="distance"
                type="number"
                step="0.01"
                value={editedRecord.distance}
                onChange={(e) => setEditedRecord(prev => ({ ...prev, distance: e.target.value }))}
                placeholder="Ex: 5.5"
              />
            </div>
            <div>
              <Label htmlFor="duration">Duração (minutos)</Label>
              <Input
                id="duration"
                type="number"
                value={editedRecord.duration}
                onChange={(e) => setEditedRecord(prev => ({ ...prev, duration: e.target.value }))}
                placeholder="Ex: 30"
              />
            </div>
            <div>
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                type="date"
                value={editedRecord.date}
                onChange={(e) => setEditedRecord(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={editedRecord.notes}
                onChange={(e) => setEditedRecord(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Adicione observações sobre sua corrida..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdate}>
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-white/95 backdrop-blur-xl border border-red-100 shadow-xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-red-800 flex items-center">
              <Trash2 className="mr-2 h-5 w-5 text-red-500" />
              Excluir Registro
            </DialogTitle>
            <DialogDescription className="text-red-600">
              Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Excluir
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

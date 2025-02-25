
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

interface NewChallengeFormProps {
  onSuccess: () => void;
  onClose: () => void;
}

export function NewChallengeForm({ onSuccess, onClose }: NewChallengeFormProps) {
  const [newChallenge, setNewChallenge] = useState({
    title: "",
    yearlyGoal: "",
    endDate: "",
    description: "",
    category: "",
    difficulty: "médio",
    visibility: "público",
    challengeType: "running"
  });

  const handleSubmit = async () => {
    try {
      if (!newChallenge.title || !newChallenge.yearlyGoal || !newChallenge.endDate) {
        toast.error("Por favor, preencha todos os campos obrigatórios");
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        toast.error("Usuário não autenticado");
        return;
      }

      const { error } = await supabase.from('running_challenges').insert({
        user_id: session.user.id,
        title: newChallenge.title,
        yearly_goal: parseFloat(newChallenge.yearlyGoal),
        end_date: newChallenge.endDate,
        start_date: new Date().toISOString().split('T')[0],
        description: newChallenge.description,
        category: newChallenge.category,
        difficulty: newChallenge.difficulty,
        visibility: newChallenge.visibility,
        challenge_type: newChallenge.challengeType
      });

      if (error) throw error;

      toast.success("Desafio criado com sucesso!");
      onSuccess();
      onClose();
      setNewChallenge({
        title: "",
        yearlyGoal: "",
        endDate: "",
        description: "",
        category: "",
        difficulty: "médio",
        visibility: "público",
        challengeType: "running"
      });
    } catch (error) {
      console.error("Error in handleNewChallenge:", error);
      toast.error("Erro ao criar desafio");
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="title">Título do Desafio</Label>
        <Input
          id="title"
          value={newChallenge.title}
          onChange={(e) => setNewChallenge(prev => ({ ...prev, title: e.target.value }))}
          placeholder="Ex: Desafio 2024"
        />
      </div>
      <div>
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={newChallenge.description}
          onChange={(e) => setNewChallenge(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Descreva seu desafio..."
        />
      </div>
      <div>
        <Label htmlFor="challengeType">Tipo de Desafio</Label>
        <Select
          value={newChallenge.challengeType}
          onValueChange={(value) => setNewChallenge(prev => ({ ...prev, challengeType: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o tipo de desafio" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="running">Corrida</SelectItem>
            <SelectItem value="gym">Academia</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="yearlyGoal">
          {newChallenge.challengeType === "running" ? "Meta Anual (km)" : "Meta Anual (dias)"}
        </Label>
        <Input
          id="yearlyGoal"
          type="number"
          value={newChallenge.yearlyGoal}
          onChange={(e) => setNewChallenge(prev => ({ ...prev, yearlyGoal: e.target.value }))}
          placeholder={newChallenge.challengeType === "running" ? "Ex: 2025" : "Ex: 200"}
        />
      </div>
      <div>
        <Label htmlFor="difficulty">Dificuldade</Label>
        <Select
          value={newChallenge.difficulty}
          onValueChange={(value) => setNewChallenge(prev => ({ ...prev, difficulty: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione a dificuldade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fácil">Fácil</SelectItem>
            <SelectItem value="médio">Médio</SelectItem>
            <SelectItem value="difícil">Difícil</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="visibility">Visibilidade</Label>
        <Select
          value={newChallenge.visibility}
          onValueChange={(value) => setNewChallenge(prev => ({ ...prev, visibility: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione a visibilidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="público">Público</SelectItem>
            <SelectItem value="privado">Privado</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="endDate">Data Final</Label>
        <Input
          id="endDate"
          type="date"
          value={newChallenge.endDate}
          onChange={(e) => setNewChallenge(prev => ({ ...prev, endDate: e.target.value }))}
        />
      </div>
      <Button onClick={handleSubmit} className="w-full">
        Criar Desafio
      </Button>
    </div>
  );
}

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Sparkles } from 'lucide-react';

export const NutritionSetupForm = () => {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    idade: '',
    sexo: 'masculino',
    altura_cm: '',
    peso_kg: '',
    objetivo: 'manutencao',
    frequencia_treino: '4-5x',
    atividade_fora_treino: 'leve',
    gordura_percentual: '',
    massa_magra_kg: '',
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!session?.user?.id) return;
    if (!form.idade || !form.altura_cm || !form.peso_kg) {
      toast({ title: 'Preencha idade, altura e peso', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const userId = session.user.id;

      const { error: profErr } = await supabase
        .from('fitness_nutrition_profile')
        .upsert({
          user_id: userId,
          idade: Number(form.idade),
          sexo: form.sexo,
          altura_cm: Number(form.altura_cm),
          peso_kg: Number(form.peso_kg),
          objetivo: form.objetivo as any,
          frequencia_treino: form.frequencia_treino as any,
          atividade_fora_treino: form.atividade_fora_treino as any,
        }, { onConflict: 'user_id' });
      if (profErr) throw profErr;

      const { error: bioErr } = await supabase
        .from('fitness_bioimpedance')
        .insert({
          user_id: userId,
          peso_kg: Number(form.peso_kg),
          gordura_percentual: form.gordura_percentual ? Number(form.gordura_percentual) : null,
          massa_magra_kg: form.massa_magra_kg ? Number(form.massa_magra_kg) : null,
        });
      if (bioErr) throw bioErr;

      toast({ title: 'Metas calculadas!', description: 'Suas metas nutricionais foram geradas automaticamente.' });
      queryClient.invalidateQueries({ queryKey: ['nutrition-goals'] });
    } catch (e: any) {
      toast({ title: 'Erro ao salvar', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-purple-500" />
          Configurar metas nutricionais
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Preencha seu perfil — calcularemos calorias e macros automaticamente.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div>
            <Label>Idade</Label>
            <Input type="number" value={form.idade} onChange={(e) => set('idade', e.target.value)} />
          </div>
          <div>
            <Label>Sexo</Label>
            <Select value={form.sexo} onValueChange={(v) => set('sexo', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="masculino">Masculino</SelectItem>
                <SelectItem value="feminino">Feminino</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Altura (cm)</Label>
            <Input type="number" value={form.altura_cm} onChange={(e) => set('altura_cm', e.target.value)} />
          </div>
          <div>
            <Label>Peso (kg)</Label>
            <Input type="number" step="0.1" value={form.peso_kg} onChange={(e) => set('peso_kg', e.target.value)} />
          </div>
          <div>
            <Label>% Gordura</Label>
            <Input type="number" step="0.1" placeholder="opcional" value={form.gordura_percentual} onChange={(e) => set('gordura_percentual', e.target.value)} />
          </div>
          <div>
            <Label>Massa magra (kg)</Label>
            <Input type="number" step="0.1" placeholder="opcional" value={form.massa_magra_kg} onChange={(e) => set('massa_magra_kg', e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <Label>Objetivo</Label>
            <Select value={form.objetivo} onValueChange={(v) => set('objetivo', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cutting">Cutting</SelectItem>
                <SelectItem value="recomp">Recomp</SelectItem>
                <SelectItem value="manutencao">Manutenção</SelectItem>
                <SelectItem value="bulking">Bulking</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Frequência de treino</Label>
            <Select value={form.frequencia_treino} onValueChange={(v) => set('frequencia_treino', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1-3x">1-3x / semana</SelectItem>
                <SelectItem value="4-5x">4-5x / semana</SelectItem>
                <SelectItem value="6-7x">6-7x / semana</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Atividade fora do treino</Label>
            <Select value={form.atividade_fora_treino} onValueChange={(v) => set('atividade_fora_treino', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sedentario">Sedentário</SelectItem>
                <SelectItem value="leve">Leve</SelectItem>
                <SelectItem value="moderado">Moderado</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={handleSubmit} disabled={saving} className="w-full">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
          Calcular minhas metas
        </Button>
      </CardContent>
    </Card>
  );
};


import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FilePlus, FileText, Printer } from "lucide-react";

export function BudgetTab() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Orçamentos</h2>
          <p className="text-muted-foreground">
            Gerencie seus orçamentos e propostas comerciais
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            Visualizar
          </Button>
          <Button variant="outline">
            <Printer className="mr-2 h-4 w-4" />
            Exportar PDF
          </Button>
          <Button>
            <FilePlus className="mr-2 h-4 w-4" />
            Novo Orçamento
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações do Cliente</CardTitle>
            <CardDescription>
              Preencha os dados do cliente para o orçamento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientName">Nome do Cliente</Label>
                <Input id="clientName" placeholder="Nome completo ou razão social" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="document">CPF/CNPJ</Label>
                <Input id="document" placeholder="Digite o documento" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" placeholder="email@exemplo.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" placeholder="(00) 00000-0000" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Endereço Completo</Label>
              <Textarea id="address" placeholder="Digite o endereço completo" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Detalhes do Orçamento</CardTitle>
            <CardDescription>
              Configure os itens e condições do orçamento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="validUntil">Validade</Label>
                <Input id="validUntil" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentTerms">Condição de Pagamento</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vista">À Vista</SelectItem>
                    <SelectItem value="30dias">30 Dias</SelectItem>
                    <SelectItem value="2x">2x Sem Juros</SelectItem>
                    <SelectItem value="3x">3x Sem Juros</SelectItem>
                    <SelectItem value="custom">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="delivery">Prazo de Entrega</Label>
                <Input id="delivery" placeholder="Ex: 30 dias úteis" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Itens do Orçamento</Label>
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-12 gap-4 mb-4 font-semibold">
                    <div className="col-span-5">Descrição</div>
                    <div className="col-span-2">Quantidade</div>
                    <div className="col-span-2">Valor Unit.</div>
                    <div className="col-span-2">Valor Total</div>
                    <div className="col-span-1"></div>
                  </div>
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-5">
                      <Input placeholder="Descrição do item" />
                    </div>
                    <div className="col-span-2">
                      <Input type="number" min="1" placeholder="Qtd" />
                    </div>
                    <div className="col-span-2">
                      <Input type="number" step="0.01" min="0" placeholder="R$ 0,00" />
                    </div>
                    <div className="col-span-2">
                      <Input type="number" step="0.01" min="0" placeholder="R$ 0,00" readOnly />
                    </div>
                    <div className="col-span-1">
                      <Button variant="ghost" size="sm">+</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                placeholder="Adicione informações importantes, termos e condições"
                className="min-h-[100px]"
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="text-sm text-muted-foreground">
              * Todos os campos são obrigatórios
            </div>
            <div className="space-x-2">
              <Button variant="outline">Cancelar</Button>
              <Button>Salvar Orçamento</Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

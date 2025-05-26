
import React from 'react';
import { AIChat } from './AIChat';

export const AIAssistantTab = () => {
  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-[#9b87f5] to-[#33C3F0] bg-clip-text text-transparent">
          Assistente Virtual IA
        </h2>
        <div className="h-1 flex-grow ml-4 bg-gradient-to-r from-[#9b87f5] to-[#33C3F0] rounded-full opacity-60"></div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AIChat />
        </div>
        
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-[#9b87f5]/10 to-[#33C3F0]/10 p-4 rounded-lg border border-[#9b87f5]/20">
            <h3 className="font-semibold mb-3 text-[#9b87f5]">Comandos Disponíveis</h3>
            <div className="space-y-2 text-sm">
              <div className="p-2 bg-white/50 rounded border">
                <strong>Tarefas:</strong> "Adicionar tarefa X para amanhã"
              </div>
              <div className="p-2 bg-white/50 rounded border">
                <strong>Finanças:</strong> "Registrar gasto de R$ X"
              </div>
              <div className="p-2 bg-white/50 rounded border">
                <strong>Reuniões:</strong> "Agendar reunião com Y"
              </div>
              <div className="p-2 bg-white/50 rounded border">
                <strong>Insights:</strong> "Como está minha produtividade?"
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-4 rounded-lg border border-green-200">
            <h3 className="font-semibold mb-3 text-green-700">Recursos da IA</h3>
            <ul className="space-y-1 text-sm text-green-600">
              <li>• Análise de dados pessoais</li>
              <li>• Sugestões de produtividade</li>
              <li>• Auto-categorização</li>
              <li>• Insights financeiros</li>
              <li>• Comandos em linguagem natural</li>
              <li>• Resumos automáticos</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

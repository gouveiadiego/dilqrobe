
import { useState } from "react";
import { Card } from "@/components/ui/card";

export default function Dashboard() {
  return (
    <div className="container mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
      <p className="text-sm md:text-base text-gray-500 dark:text-gray-400">
        Bem-vindo ao seu Painel de Controle
      </p>
      
      <Card className="p-4 md:p-6 border shadow-sm dark:bg-gray-900/60 backdrop-blur-sm">
        <h2 className="text-lg md:text-xl font-semibold mb-4">
          Visão Geral
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-lg">
            <h3 className="font-medium text-green-800 dark:text-green-300">Projetos Ativos</h3>
            <p className="text-2xl font-bold text-green-800 dark:text-green-300">0</p>
          </div>
          <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-lg">
            <h3 className="font-medium text-blue-800 dark:text-blue-300">Clientes</h3>
            <p className="text-2xl font-bold text-blue-800 dark:text-blue-300">0</p>
          </div>
          <div className="bg-purple-100 dark:bg-purple-900/30 p-4 rounded-lg">
            <h3 className="font-medium text-purple-800 dark:text-purple-300">Reuniões Agendadas</h3>
            <p className="text-2xl font-bold text-purple-800 dark:text-purple-300">0</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

import React from "react";
import { Session } from "@supabase/supabase-js";
import { useOneSignalPush } from "@/hooks/useOneSignalPush";

interface DashboardProps {
  session: Session | null;
}

export default function Dashboard({ session }: DashboardProps) {
  // Chama o hook para inicializar o push ao entrar no Dashboard
  useOneSignalPush();

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <p>Bem-vindo(a) ao seu painel, {session?.user?.email}!</p>
      <p>Esta é a página inicial do aplicativo DilQ Orbe.</p>
    </div>
  );
}

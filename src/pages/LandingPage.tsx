
import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <header className="flex justify-between items-center mb-16">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">Dilq</div>
          <div className="space-x-4">
            <Link to="/login">
              <Button variant="outline">Entrar</Button>
            </Link>
            <Link to="/login">
              <Button>Começar</Button>
            </Link>
          </div>
        </header>

        <main>
          <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-gray-900 dark:text-white">
                Gerencie suas finanças com facilidade
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                Controle seus gastos, acompanhe suas receitas e alcance seus
                objetivos financeiros com nossa plataforma intuitiva.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/login">
                  <Button size="lg" className="w-full sm:w-auto">
                    Começar agora
                  </Button>
                </Link>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-xl">
              <img
                src="/lovable-uploads/48deecf0-3c7d-4ab4-84b1-914f996e585e.png"
                alt="Dashboard preview"
                className="rounded-lg shadow-md"
              />
            </div>
          </div>

          <div className="text-center mb-24">
            <h2 className="text-3xl md:text-4xl font-bold mb-12 text-gray-900 dark:text-white">
              Recursos principais
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                  Acompanhamento detalhado
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Veja exatamente para onde seu dinheiro está indo com gráficos e
                  relatórios detalhados.
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                  Planejamento financeiro
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Crie orçamentos personalizados e receba alertas quando estiver
                  próximo de ultrapassá-los.
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                  Metas financeiras
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Estabeleça metas de economia e acompanhe seu progresso ao longo
                  do tempo.
                </p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-gray-900 dark:text-white">
              Pronto para começar?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Junte-se a milhares de pessoas que já estão controlando melhor suas
              finanças com nossa plataforma.
            </p>
            <Link to="/login">
              <Button size="lg">Criar conta grátis</Button>
            </Link>
          </div>
        </main>

        <footer className="mt-24 text-center text-gray-600 dark:text-gray-400">
          <p>© 2024 Dilq. Todos os direitos reservados.</p>
        </footer>
      </div>
    </div>
  );
}

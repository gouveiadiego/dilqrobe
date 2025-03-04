
import React from 'react';
import { Link } from 'react-router-dom';
import { PricingSection } from '@/components/subscription/PricingSection';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0e101c] text-white overflow-hidden">
      {/* Header */}
      <header className="bg-transparent absolute top-0 left-0 right-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white">Dilq</h1>
            </div>
            <nav className="hidden md:block">
              <ul className="flex space-x-6">
                <li><Link to="/login" className="text-gray-300 hover:text-white transition">Entrar</Link></li>
              </ul>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center">
        {/* Background with stars/particles effect */}
        <div className="absolute inset-0 bg-[#0e101c] overflow-hidden">
          <div className="absolute inset-0 opacity-30">
            {Array.from({ length: 50 }).map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-white"
                style={{
                  width: `${Math.random() * 3 + 1}px`,
                  height: `${Math.random() * 3 + 1}px`,
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  opacity: Math.random() * 0.7 + 0.3,
                }}
              />
            ))}
          </div>
        </div>

        <div className="container mx-auto px-4 flex flex-col lg:flex-row items-center relative z-10">
          {/* Left content */}
          <div className="w-full lg:w-1/2 pt-20 lg:pt-0">
            <div className="inline-block px-4 py-1 rounded-full bg-opacity-20 bg-gray-700 text-white text-sm mb-6">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
                Tecnologia de ponta
              </div>
            </div>

            <h2 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
              O Grande
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-blue-400 to-teal-400">
                Alinhamento
              </span>
            </h2>

            <p className="text-gray-400 text-lg mb-8 max-w-lg">
              Sincronize sua mente, corpo e propósito. Transforme sua existência em um estado de alta performance e significado através deste sistema integrado de gestão.
            </p>

            <div className="flex flex-wrap gap-4 mb-8">
              <div className="inline-flex items-center text-gray-400 text-sm">
                <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                Horário atual no Brasil: {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - Noite
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                to="/login" 
                className="px-8 py-3 rounded-lg font-medium bg-gradient-to-r from-purple-600 to-blue-500 hover:opacity-90 transition text-center"
              >
                Começar Agora
              </Link>
              <a 
                href="#pricing" 
                className="px-8 py-3 border border-gray-700 rounded-lg font-medium hover:bg-gray-800 transition text-center"
              >
                Ver preços
              </a>
            </div>
          </div>

          {/* Right image */}
          <div className="w-full lg:w-1/2 mt-12 lg:mt-0">
            <div className="relative">
              <div className="rounded-lg overflow-hidden shadow-2xl border border-gray-800">
                <img 
                  src="/lovable-uploads/39edcd3a-aea5-4d13-9511-2c264f277612.png" 
                  alt="Pessoa trabalhando com vista para a natureza" 
                  className="w-full h-auto rounded-lg" 
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <div id="pricing">
        <PricingSection />
      </div>

      {/* Footer */}
      <footer className="bg-[#080a14] py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Dilq</h3>
              <p className="text-gray-400">
                A melhor ferramenta para gerenciar sua vida pessoal e profissional.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Links rápidos</h4>
              <ul className="space-y-2">
                <li><a href="#pricing" className="text-gray-400 hover:text-white transition">Preços</a></li>
                <li><Link to="/login" className="text-gray-400 hover:text-white transition">Entrar</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Contato</h4>
              <p className="text-gray-400">contato@dilq.com.br</p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500">
            <p>&copy; {new Date().getFullYear()} Dilq. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;


import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    
    fetchUser();
  }, []);
  
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };
  
  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <button 
            onClick={handleSignOut}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Sair
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold mb-4">Bem-vindo!</h2>
            <p className="text-gray-600 dark:text-gray-300">
              Esta é uma página inicial temporária enquanto construímos o restante do aplicativo.
            </p>
            <p className="text-gray-600 dark:text-gray-300 mt-3">
              Email: {user?.email}
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold mb-4">Links rápidos</h2>
            <ul className="space-y-2">
              <li>
                <a 
                  href="/client-portal" 
                  className="text-blue-600 dark:text-blue-400 hover:underline flex items-center"
                >
                  → Portal do Cliente
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

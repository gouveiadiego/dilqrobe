import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ProfileTextarea } from "./ProfileTextarea";

export function ProfileTab() {
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [about, setAbout] = useState("");

  useEffect(() => {
    getProfile();
  }, []);

  async function getProfile() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        throw new Error('No user found');
      }

      console.log('Fetching profile for user:', session.user.id);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('username, full_name, about')
        .eq('id', session.user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        throw error;
      }

      console.log('Profile data:', data);

      if (data) {
        setUsername(data.username || '');
        setFullName(data.full_name || '');
        setAbout(data.about || '');
      } else {
        console.log('No profile found, creating one...');
        // If no profile exists, create one
        const { error: insertError } = await supabase
          .from('profiles')
          .insert([
            { 
              id: session.user.id,
              username: '',
              full_name: '',
              about: ''
            }
          ]);

        if (insertError) {
          console.error('Error creating profile:', insertError);
          throw insertError;
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Error loading profile');
    } finally {
      setLoading(false);
    }
  }

  async function updateProfile() {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        throw new Error('No user found');
      }

      const updates = {
        id: session.user.id,
        username,
        full_name: fullName,
        about
      };

      console.log('Updating profile with:', updates);

      const { error } = await supabase
        .from('profiles')
        .upsert(updates);

      if (error) throw error;
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Error updating profile');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">Perfil</h2>
        <p className="text-muted-foreground">
          Gerencie suas informações pessoais
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium mb-2">
            Nome de usuário
          </label>
          <Input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="fullName" className="block text-sm font-medium mb-2">
            Nome completo
          </label>
          <Input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="about" className="block text-sm font-medium mb-2">
            Sobre
          </label>
          <ProfileTextarea
            value={about}
            onChange={setAbout}
            placeholder="Conte um pouco sobre você..."
            rows={6}
          />
        </div>

        <div className="pt-4">
          <Button onClick={updateProfile} disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar alterações'}
          </Button>
        </div>
      </div>
    </div>
  );
}
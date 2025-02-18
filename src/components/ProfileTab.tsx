
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ProfileTextarea } from "./ProfileTextarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, Building } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";

interface Profile {
  username: string | null;
  full_name: string | null;
  about: string | null;
  avatar_url: string | null;
  company_logo: string | null;
}

export function ProfileTab() {
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [about, setAbout] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const navigate = useNavigate();

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
        .select('username, full_name, about, avatar_url, company_logo')
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
        setAvatarUrl(data.avatar_url);
        setCompanyLogo(data.company_logo);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Erro ao carregar perfil');
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
        about,
        avatar_url: avatarUrl,
        company_logo: companyLogo
      };

      console.log('Updating profile with:', updates);

      const { error } = await supabase
        .from('profiles')
        .upsert(updates);

      if (error) throw error;
      toast.success('Perfil atualizado com sucesso');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  }

  async function uploadAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setLoading(true);
      const file = event.target.files?.[0];
      
      if (!file) {
        throw new Error('Nenhum arquivo selecionado');
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error('Usuário não encontrado');
      }

      const fileExt = file.name.split('.').pop();
      const filePath = `${session.user.id}/${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);
      toast.success('Foto de perfil atualizada com sucesso');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Erro ao fazer upload da foto de perfil');
    } finally {
      setLoading(false);
    }
  }

  async function uploadCompanyLogo(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setLoading(true);
      const file = event.target.files?.[0];
      
      if (!file) {
        throw new Error('Nenhum arquivo selecionado');
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error('Usuário não encontrado');
      }

      const fileExt = file.name.split('.').pop();
      const filePath = `${session.user.id}/${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
        .from('company-logos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('company-logos')
        .getPublicUrl(filePath);

      setCompanyLogo(publicUrl);
      toast.success('Logo da empresa atualizada com sucesso');
    } catch (error) {
      console.error('Error uploading company logo:', error);
      toast.error('Erro ao fazer upload da logo da empresa');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteAccount() {
    try {
      setLoading(true);
      console.log('Starting account deletion process...');
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Error getting session:', sessionError);
        throw sessionError;
      }
      
      if (!session?.user) {
        console.log('No active session found');
        navigate('/login');
        return;
      }

      console.log('Session found, proceeding with deletion...');
      console.log('Access token:', session.access_token);

      const { data, error } = await supabase.functions.invoke('delete-user', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Error from Edge Function:', error);
        throw error;
      }

      console.log('Account deleted successfully:', data);
      toast.success('Conta excluída com sucesso');
      
      await supabase.auth.signOut();
      navigate('/login');
    } catch (error: any) {
      console.error('Error deleting account:', error);
      toast.error(error.message || 'Erro ao excluir conta');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">Perfil</h2>
        <p className="text-muted-foreground">
          Gerencie suas informações pessoais e da empresa
        </p>
      </div>

      <div className="space-y-8">
        <div className="flex items-center space-x-8">
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={avatarUrl || ''} alt={fullName} />
              <AvatarFallback>{fullName?.charAt(0) || '?'}</AvatarFallback>
            </Avatar>
            <div className="flex items-center space-x-2">
              <Input
                type="file"
                accept="image/*"
                onChange={uploadAvatar}
                className="hidden"
                id="avatar-upload"
                disabled={loading}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('avatar-upload')?.click()}
                disabled={loading}
              >
                <Upload className="mr-2 h-4 w-4" />
                Foto de perfil
              </Button>
            </div>
          </div>

          <div className="flex flex-col items-center space-y-4">
            <div className="h-24 w-24 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
              {companyLogo ? (
                <img src={companyLogo} alt="Logo da empresa" className="h-full w-full object-contain" />
              ) : (
                <Building className="h-12 w-12 text-gray-400" />
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Input
                type="file"
                accept="image/*"
                onChange={uploadCompanyLogo}
                className="hidden"
                id="company-logo-upload"
                disabled={loading}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('company-logo-upload')?.click()}
                disabled={loading}
              >
                <Upload className="mr-2 h-4 w-4" />
                Logo da empresa
              </Button>
            </div>
          </div>
        </div>

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

        <div className="pt-4 flex justify-between">
          <Button onClick={updateProfile} disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar alterações'}
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                Deletar conta
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. Isso irá deletar permanentemente sua conta
                  e remover seus dados dos nossos servidores.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground">
                  Deletar conta
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}

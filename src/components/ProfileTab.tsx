
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ProfileTextarea } from "./ProfileTextarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, Building, Save, User, Briefcase, FileText, AlertTriangle } from "lucide-react";
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
import { Card, CardContent } from "@/components/ui/card";

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
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-dilq-blue/10 to-dilq-purple/10 rounded-2xl blur-3xl -z-10 opacity-70"></div>
        <div className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-gray-900/60 dark:to-gray-800/60 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="text-3xl font-bold bg-gradient-to-r from-dilq-blue to-dilq-purple bg-clip-text text-transparent">
                Perfil Pessoal
              </div>
              <div className="hidden md:block h-8 w-px bg-gray-200 dark:bg-gray-700"></div>
              <div className="text-muted-foreground">
                Gerencie suas informações e credenciais
              </div>
            </div>
            <Button onClick={updateProfile} disabled={loading} className="bg-gradient-to-r from-dilq-blue to-dilq-purple hover:from-dilq-blue/90 hover:to-dilq-purple/90 transition-all duration-300 shadow-md hover:shadow-lg group">
              <Save className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
              {loading ? 'Salvando...' : 'Salvar alterações'}
            </Button>
          </div>
          
          <Card className="mb-8 border-none shadow-md hover:shadow-lg transition-all duration-300 bg-white/70 dark:bg-gray-800/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-start gap-8">
                <div className="flex flex-col items-center space-y-4 w-full md:w-auto">
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-dilq-accent to-dilq-teal rounded-full blur opacity-30 group-hover:opacity-80 transition-opacity duration-300"></div>
                    <Avatar className="h-32 w-32 ring-2 ring-white dark:ring-gray-800 ring-offset-2 ring-offset-background relative shadow-xl">
                      <AvatarImage src={avatarUrl || ''} alt={fullName} className="object-cover" />
                      <AvatarFallback className="bg-gradient-to-br from-dilq-blue to-dilq-accent text-white text-2xl font-medium">
                        {fullName?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                  </div>
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
                      className="group hover:bg-dilq-blue/10 hover:text-dilq-blue transition-all duration-300"
                    >
                      <Upload className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
                      Foto de perfil
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col space-y-4 flex-1">
                  <div className="space-y-2">
                    <label htmlFor="username" className="text-sm font-medium flex items-center gap-2 text-dilq-blue">
                      <User className="h-4 w-4" />
                      Nome de usuário
                    </label>
                    <Input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      disabled={loading}
                      className="border-gray-200 focus:border-dilq-accent focus:ring-dilq-accent/30 transition-all duration-300"
                      placeholder="Seu nome de usuário"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="fullName" className="text-sm font-medium flex items-center gap-2 text-dilq-blue">
                      <User className="h-4 w-4" />
                      Nome completo
                    </label>
                    <Input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      disabled={loading}
                      className="border-gray-200 focus:border-dilq-accent focus:ring-dilq-accent/30 transition-all duration-300"
                      placeholder="Seu nome completo"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-8 border-none shadow-md hover:shadow-lg transition-all duration-300 bg-white/70 dark:bg-gray-800/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-start gap-8">
                <div className="flex flex-col items-center space-y-4 w-full md:w-auto">
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-dilq-teal to-dilq-accent rounded-xl blur opacity-30 group-hover:opacity-80 transition-opacity duration-300"></div>
                    <div className="h-32 w-32 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl flex items-center justify-center overflow-hidden bg-white dark:bg-gray-900 relative shadow-xl">
                      {companyLogo ? (
                        <img src={companyLogo} alt="Logo da empresa" className="h-full w-full object-contain" />
                      ) : (
                        <Building className="h-16 w-16 text-gray-400" />
                      )}
                    </div>
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
                      className="group hover:bg-dilq-teal/10 hover:text-dilq-teal transition-all duration-300"
                    >
                      <Upload className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
                      Logo da empresa
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col space-y-4 flex-1">
                  <div className="space-y-2 flex-1">
                    <label htmlFor="about" className="text-sm font-medium flex items-center gap-2 text-dilq-teal">
                      <FileText className="h-4 w-4" />
                      Sobre
                    </label>
                    <ProfileTextarea
                      value={about}
                      onChange={setAbout}
                      placeholder="Conte um pouco sobre você e sua empresa..."
                      rows={6}
                      className="resize-none border-gray-200 focus:border-dilq-teal focus:ring-dilq-teal/30 bg-white/60 dark:bg-gray-900/60 transition-all duration-300"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6 flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              <Briefcase className="inline-block mr-2 h-4 w-4 text-dilq-accent" />
              Sua conta foi criada como perfil empresarial
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" className="text-destructive hover:text-destructive/90 hover:bg-destructive/10 border border-destructive/20 group transition-all duration-300">
                  <AlertTriangle className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
                  Deletar conta
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-white dark:bg-gray-900 border border-destructive/20 shadow-lg backdrop-blur-sm">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-xl">Você tem certeza?</AlertDialogTitle>
                  <AlertDialogDescription className="text-muted-foreground">
                    Esta ação não pode ser desfeita. Isso irá deletar permanentemente sua conta
                    e remover seus dados dos nossos servidores.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Cancelar</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDeleteAccount} 
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors focus:ring-destructive"
                  >
                    Deletar conta
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  );
}

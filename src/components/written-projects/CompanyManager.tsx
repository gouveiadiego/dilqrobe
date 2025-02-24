
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { toast } from "sonner";

interface Company {
  id: string;
  name: string;
  description: string | null;
  contact_person: string | null;
  contact_email: string | null;
  contact_phone: string | null;
}

export function CompanyManager() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_companies')
        .select('*')
        .order('name');
      
      if (error) {
        toast.error('Error loading companies');
        throw error;
      }
      
      return data;
    }
  });

  const addCompanyMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const newCompany = {
        user_id: user.id,
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        contact_person: formData.get('contact_person') as string,
        contact_email: formData.get('contact_email') as string,
        contact_phone: formData.get('contact_phone') as string,
      };

      const { error } = await supabase.from('project_companies').insert([newCompany]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      setOpen(false);
      toast.success('Company added successfully');
    },
    onError: (error) => {
      toast.error('Error adding company');
      console.error(error);
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    addCompanyMutation.mutate(formData);
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Companies</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Company
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Company</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Company Name</Label>
                <Input id="name" name="name" required />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input id="description" name="description" />
              </div>
              <div>
                <Label htmlFor="contact_person">Contact Person</Label>
                <Input id="contact_person" name="contact_person" />
              </div>
              <div>
                <Label htmlFor="contact_email">Contact Email</Label>
                <Input id="contact_email" name="contact_email" type="email" />
              </div>
              <div>
                <Label htmlFor="contact_phone">Contact Phone</Label>
                <Input id="contact_phone" name="contact_phone" />
              </div>
              <Button type="submit">Add Company</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {companies.map((company: Company) => (
          <div key={company.id} className="p-4 border rounded-lg space-y-2">
            <h4 className="font-medium">{company.name}</h4>
            {company.description && <p className="text-sm text-gray-600">{company.description}</p>}
            {company.contact_person && (
              <p className="text-sm">
                <strong>Contact:</strong> {company.contact_person}
              </p>
            )}
            {company.contact_email && (
              <p className="text-sm">
                <strong>Email:</strong> {company.contact_email}
              </p>
            )}
            {company.contact_phone && (
              <p className="text-sm">
                <strong>Phone:</strong> {company.contact_phone}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

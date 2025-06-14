
import { useState } from "react";
import { useClients, Client, ServiceSummary } from "@/hooks/useClients";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "react-router-dom";
import { Pencil, Trash2, UserPlus, ExternalLink } from "lucide-react";

export function ClientManager() {
  const { clients, addClient, updateClient, deleteClient, getClientServiceSummary } = useClients();
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [showNewClientDialog, setShowNewClientDialog] = useState(false);
  const [clientSummaries, setClientSummaries] = useState<{[key: string]: ServiceSummary}>({});
  const [newClient, setNewClient] = useState({
    name: "",
    email: "",
    document: "",
    phone: "",
    address: "",
  });

  const handleSubmit = () => {
    // Verificar apenas se o nome foi preenchido
    if (!newClient.name.trim()) {
      return;
    }
    // O email vazio será substituído por um valor padrão na função addClient
    addClient(newClient);
    setNewClient({ name: "", email: "", document: "", phone: "", address: "" });
    setShowNewClientDialog(false);
  };

  const handleSaveEdit = () => {
    if (!editingClient || !editingClient.name.trim()) return;
    updateClient({ id: editingClient.id, updates: editingClient });
    setEditingClient(null);
  };

  const loadClientSummary = async (clientId: string) => {
    if (clientSummaries[clientId]) return;
    
    try {
      const summary = await getClientServiceSummary(clientId);
      setClientSummaries(prev => ({
        ...prev,
        [clientId]: summary
      }));
    } catch (error) {
      console.error("Erro ao carregar resumo do cliente:", error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Clientes</h2>
        <Dialog open={showNewClientDialog} onOpenChange={setShowNewClientDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="h-4 w-4" />
              Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Cliente</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={newClient.name}
                  onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newClient.email}
                  onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                  className="col-span-3"
                  placeholder="Deixe em branco para gerar automaticamente"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="document">Documento</Label>
                <Input
                  id="document"
                  value={newClient.document}
                  onChange={(e) => setNewClient({ ...newClient, document: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={newClient.phone}
                  onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  value={newClient.address}
                  onChange={(e) => setNewClient({ ...newClient, address: e.target.value })}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button onClick={handleSubmit}>Adicionar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Documento</TableHead>
            <TableHead>Telefone</TableHead>
            <TableHead>Endereço</TableHead>
            <TableHead>Resumo</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => (
            <TableRow 
              key={client.id}
              onMouseEnter={() => loadClientSummary(client.id)}
            >
              <TableCell>{client.name}</TableCell>
              <TableCell>{client.email}</TableCell>
              <TableCell>{client.document}</TableCell>
              <TableCell>{client.phone}</TableCell>
              <TableCell>{client.address}</TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  {clientSummaries[client.id] ? (
                    <>
                      <div className="flex gap-2 text-xs">
                        <span className="px-1 py-0.5 bg-green-100 text-green-800 rounded">
                          {clientSummaries[client.id].paidCount} pagos
                        </span>
                        <span className="px-1 py-0.5 bg-orange-100 text-orange-800 rounded">
                          {clientSummaries[client.id].pendingCount} pendentes
                        </span>
                        <span className="px-1 py-0.5 bg-yellow-100 text-yellow-800 rounded">
                          {clientSummaries[client.id].canceledCount} cancelados
                        </span>
                      </div>
                      <Link 
                        to={`/client-portal?client=${client.id}`}
                        className="text-xs flex items-center text-blue-600 hover:text-blue-800 mt-1"
                      >
                        Ver portal <ExternalLink className="h-3 w-3 ml-1" />
                      </Link>
                    </>
                  ) : (
                    <span className="text-xs text-gray-500">Carregando...</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setEditingClient(client)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Editar Cliente</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="edit-name">Nome</Label>
                          <Input
                            id="edit-name"
                            value={editingClient?.name || ""}
                            onChange={(e) =>
                              setEditingClient(prev =>
                                prev ? { ...prev, name: e.target.value } : null
                              )
                            }
                            className="col-span-3"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="edit-email">Email</Label>
                          <Input
                            id="edit-email"
                            type="email"
                            value={editingClient?.email || ""}
                            onChange={(e) =>
                              setEditingClient(prev =>
                                prev ? { ...prev, email: e.target.value } : null
                              )
                            }
                            className="col-span-3"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="edit-document">Documento</Label>
                          <Input
                            id="edit-document"
                            value={editingClient?.document || ""}
                            onChange={(e) =>
                              setEditingClient(prev =>
                                prev ? { ...prev, document: e.target.value } : null
                              )
                            }
                            className="col-span-3"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="edit-phone">Telefone</Label>
                          <Input
                            id="edit-phone"
                            value={editingClient?.phone || ""}
                            onChange={(e) =>
                              setEditingClient(prev =>
                                prev ? { ...prev, phone: e.target.value } : null
                              )
                            }
                            className="col-span-3"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="edit-address">Endereço</Label>
                          <Input
                            id="edit-address"
                            value={editingClient?.address || ""}
                            onChange={(e) =>
                              setEditingClient(prev =>
                                prev ? { ...prev, address: e.target.value } : null
                              )
                            }
                            className="col-span-3"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button variant="outline">Cancelar</Button>
                        </DialogClose>
                        <Button onClick={handleSaveEdit}>Salvar</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Confirmar Exclusão</DialogTitle>
                      </DialogHeader>
                      <p>Tem certeza que deseja excluir este cliente?</p>
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button variant="outline">Cancelar</Button>
                        </DialogClose>
                        <Button
                          variant="destructive"
                          onClick={() => deleteClient(client.id)}
                        >
                          Excluir
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

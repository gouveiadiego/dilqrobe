
import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Send, Bot, User, Sparkles, MessageCircle, Loader2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'error';
  timestamp: Date;
}

interface AIChatProps {
  compact?: boolean;
  className?: string;
}

export const AIChat = ({ compact = false, className = "" }: AIChatProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Olá! Sou seu assistente virtual do DilQ Orbe. Posso te ajudar com tarefas, finanças, reuniões e muito mais. Como posso ajudar?',
      role: 'assistant',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([
    "Como posso ser mais produtivo?",
    "Resumo das minhas atividades",
    "Sugestões para economizar",
    "Próximas tarefas importantes"
  ]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const getFallbackResponse = (messageText: string) => {
    const message = messageText.toLowerCase();
    
    if (message.includes('produtivo') || message.includes('produtividade')) {
      return "Para ser mais produtivo, recomendo: 1) Organizar suas tarefas por prioridade, 2) Usar a técnica Pomodoro, 3) Definir metas claras diárias, 4) Eliminar distrações durante o trabalho. Você pode adicionar essas práticas como hábitos no sistema!";
    }
    
    if (message.includes('tarefa') || message.includes('task')) {
      return "Para gerenciar melhor suas tarefas: vá até a aba 'Tarefas', organize por prioridade (Alta, Média, Baixa), defina prazos realistas e use as categorias para agrupar atividades similares. Você também pode usar o calendário para visualizar suas tarefas por data.";
    }
    
    if (message.includes('financ') || message.includes('gasto') || message.includes('dinheiro')) {
      return "Para controlar melhor suas finanças: acesse a aba 'Financeiro' para registrar receitas e despesas, use a aba 'Orçamento' para planejar gastos mensais, e categorize suas transações para ter uma visão clara de onde vai seu dinheiro.";
    }
    
    if (message.includes('reunião') || message.includes('meeting')) {
      return "Para organizar reuniões: use a aba 'Reuniões' para agendar compromissos, defina participantes, adicione notas e acompanhe o status. Você pode visualizar suas reuniões no calendário para melhor planejamento.";
    }
    
    return "Desculpe, estou com dificuldades técnicas no momento. Enquanto isso, você pode: explorar as abas do sistema (Tarefas, Financeiro, Reuniões, Hábitos), organizar suas atividades, ou verificar o dashboard para insights. Tente novamente em alguns minutos!";
  };

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: messageText,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setApiError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const context = messages.map(msg => ({
        role: msg.role === 'error' ? 'assistant' : msg.role,
        content: msg.content
      }));

      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          message: messageText,
          context: context.slice(-10), // Last 10 messages for context
          userId: user?.id
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        role: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      if (data.suggestions) {
        setSuggestions(data.suggestions);
      }

    } catch (error: any) {
      console.error('Error sending message:', error);
      
      // Detect specific error types
      let errorMessage = '';
      let fallbackResponse = '';
      
      if (error.message?.includes('429') || error.message?.includes('quota')) {
        errorMessage = 'Cota da API OpenAI excedida. Usando modo offline.';
        fallbackResponse = getFallbackResponse(messageText);
        setApiError('quota_exceeded');
      } else if (error.message?.includes('401') || error.message?.includes('unauthorized')) {
        errorMessage = 'Problema de autenticação com a API. Usando modo offline.';
        fallbackResponse = getFallbackResponse(messageText);
        setApiError('auth_error');
      } else {
        errorMessage = 'Erro na comunicação. Usando modo offline.';
        fallbackResponse = getFallbackResponse(messageText);
        setApiError('general_error');
      }

      // Add fallback response
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: fallbackResponse,
        role: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, fallbackMessage]);

      toast({
        title: "Modo Offline Ativado",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (compact) {
    return (
      <Card className={`${className} max-w-sm`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Bot className="h-4 w-4 text-[#9b87f5]" />
            Assistente IA
            {apiError && (
              <AlertTriangle className="h-3 w-3 text-orange-500" title="Modo Offline" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {apiError && (
            <Alert className="py-2">
              <AlertTriangle className="h-3 w-3" />
              <AlertDescription className="text-xs">
                Modo offline ativo
              </AlertDescription>
            </Alert>
          )}
          <div className="flex gap-2">
            <Input
              placeholder="Pergunte algo..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage(inputMessage)}
              className="text-xs"
            />
            <Button 
              size="sm" 
              onClick={() => sendMessage(inputMessage)}
              disabled={isLoading}
              className="bg-[#9b87f5] hover:bg-[#7E69AB]"
            >
              {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
            </Button>
          </div>
          {messages.length > 1 && (
            <div className="text-xs text-gray-500">
              Última resposta: {messages[messages.length - 1]?.content.substring(0, 50)}...
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className} h-[600px] flex flex-col`}>
      <CardHeader className="border-b bg-gradient-to-r from-[#9b87f5]/10 to-[#33C3F0]/10">
        <CardTitle className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-gradient-to-r from-[#9b87f5] to-[#33C3F0] flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          Assistente Virtual IA
          <Badge variant={apiError ? "destructive" : "secondary"} className="ml-auto">
            <MessageCircle className="h-3 w-3 mr-1" />
            {apiError ? "Offline" : "Online"}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {apiError && (
          <div className="p-3 border-b">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {apiError === 'quota_exceeded' && "Cota da API OpenAI excedida. Funcionando em modo offline com respostas básicas."}
                {apiError === 'auth_error' && "Problema de autenticação com a API. Verifique as configurações."}
                {apiError === 'general_error' && "Problema temporário de conexão. Usando modo offline."}
              </AlertDescription>
            </Alert>
          </div>
        )}

        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-[#9b87f5] to-[#33C3F0] flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                )}
                
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-[#9b87f5] text-white ml-auto'
                      : message.role === 'error'
                      ? 'bg-red-100 dark:bg-red-900 border border-red-200'
                      : 'bg-gray-100 dark:bg-gray-800'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <span className={`text-xs mt-2 block ${
                    message.role === 'user' ? 'text-white/70' : 'text-gray-500'
                  }`}>
                    {formatTime(message.timestamp)}
                  </span>
                </div>

                {message.role === 'user' && (
                  <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-[#9b87f5] to-[#33C3F0] flex items-center justify-center">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Pensando...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {suggestions.length > 0 && (
          <div className="border-t p-3 bg-gray-50 dark:bg-gray-900/50">
            <p className="text-xs text-gray-500 mb-2">Sugestões:</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="text-xs h-auto py-1 px-2"
                  disabled={isLoading}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              placeholder="Digite sua mensagem..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage(inputMessage)}
              disabled={isLoading}
              className="flex-1"
            />
            <Button 
              onClick={() => sendMessage(inputMessage)}
              disabled={isLoading || !inputMessage.trim()}
              className="bg-[#9b87f5] hover:bg-[#7E69AB]"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

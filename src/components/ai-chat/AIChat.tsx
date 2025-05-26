
import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, User, Sparkles, MessageCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
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

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const context = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          message: messageText,
          context: context.slice(-10), // Last 10 messages for context
          userId: user?.id
        }
      });

      if (error) throw error;

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

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Erro na comunicação",
        description: "Não foi possível enviar a mensagem. Tente novamente.",
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
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
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
          <Badge variant="secondary" className="ml-auto">
            <MessageCircle className="h-3 w-3 mr-1" />
            Online
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
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

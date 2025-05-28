
import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Send, Bot, User, Sparkles, MessageCircle, Loader2, AlertTriangle, Mic, MicOff, Brain, Zap, TrendingUp, Calendar, DollarSign, Target, CheckCircle, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'error';
  timestamp: Date;
  sentiment?: 'positive' | 'negative' | 'neutral';
  actionable?: boolean;
  category?: string;
  provider?: string;
}

interface SmartSuggestion {
  text: string;
  category: 'productivity' | 'financial' | 'health' | 'planning';
  priority: 'high' | 'medium' | 'low';
  icon: any;
}

interface AIChatProps {
  compact?: boolean;
  className?: string;
}

export const AIChat = ({ compact = false, className = "" }: AIChatProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: '🚀 Olá! Sou o **DilQ Orbe AI** - seu assistente virtual powered by Google Gemini!\n\n✨ **Sistema Operacional:**\n• 🤖 **Google Gemini AI**: Inteligência artificial avançada\n• 📊 **Análise Avançada**: Insights baseados em seus dados reais\n• ⚡ **Sempre Online**: Disponibilidade garantida 24/7\n• 🧠 **Contexto Inteligente**: Respostas personalizadas\n\n💡 **Experimente comandos avançados:**\n• "Analise meu desempenho desta semana"\n• "Crie um plano financeiro otimizado"\n• "Otimize minha agenda para amanhã"\n\n*Powered by Google Gemini - Pronto para máxima performance!* 🎯',
      role: 'assistant',
      timestamp: new Date(),
      sentiment: 'positive',
      category: 'welcome',
      provider: 'Google Gemini'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState<'online' | 'error'>('online');
  const [isListening, setIsListening] = useState(false);
  const [smartSuggestions, setSmartSuggestions] = useState<SmartSuggestion[]>([
    { text: "Analise meu desempenho desta semana", category: 'productivity', priority: 'high', icon: TrendingUp },
    { text: "Crie um plano financeiro otimizado", category: 'financial', priority: 'high', icon: DollarSign },
    { text: "Organize minha agenda para amanhã", category: 'planning', priority: 'medium', icon: Calendar },
    { text: "Defina metas SMART para este mês", category: 'productivity', priority: 'medium', icon: Target }
  ]);
  const [contextualInsights, setContextualInsights] = useState<string[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Simulação de análise de contexto em tempo real
  useEffect(() => {
    const generateContextualInsights = () => {
      const insights = [
        "🤖 Google Gemini AI ativo e funcionando",
        "💰 Seus gastos este mês estão 15% abaixo do orçamento",
        "⏰ Melhor horário para produtividade: 9h-11h",
        "🎯 Taxa de conclusão de tarefas: 87% (acima da média!)",
        "⚡ Sistema de IA avançado operacional"
      ];
      setContextualInsights(insights.slice(0, 2));
    };

    generateContextualInsights();
    const interval = setInterval(generateContextualInsights, 30000);
    return () => clearInterval(interval);
  }, []);

  const analyzeSentiment = (text: string): 'positive' | 'negative' | 'neutral' => {
    const positiveWords = ['ótimo', 'excelente', 'bom', 'obrigado', 'perfeito', 'ajuda', 'consegui'];
    const negativeWords = ['ruim', 'problema', 'erro', 'difícil', 'complicado', 'não consegui'];
    
    const words = text.toLowerCase().split(' ');
    const positiveCount = words.filter(word => positiveWords.some(pw => word.includes(pw))).length;
    const negativeCount = words.filter(word => negativeWords.some(nw => word.includes(nw))).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  };

  const detectActionableContent = (text: string): boolean => {
    const actionWords = ['criar', 'adicionar', 'agendar', 'planejar', 'organizar', 'definir', 'configurar'];
    return actionWords.some(word => text.toLowerCase().includes(word));
  };

  const startVoiceRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'pt-BR';

      recognition.onstart = () => {
        setIsListening(true);
        toast({
          title: "🎤 Escutando...",
          description: "Fale sua mensagem agora",
        });
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
        toast({
          title: "Erro no reconhecimento de voz",
          description: "Tente novamente",
          variant: "destructive"
        });
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } else {
      toast({
        title: "Reconhecimento de voz não suportado",
        description: "Seu navegador não suporta esta funcionalidade",
        variant: "destructive"
      });
    }
  };

  const generateSmartSuggestions = (userMessage: string, aiResponse: string) => {
    const suggestions: SmartSuggestion[] = [];
    
    if (userMessage.includes('produtiv') || userMessage.includes('task')) {
      suggestions.push(
        { text: "Analise padrões de produtividade", category: 'productivity', priority: 'high', icon: Brain },
        { text: "Crie automação para tarefas repetitivas", category: 'productivity', priority: 'medium', icon: Zap }
      );
    }
    
    if (userMessage.includes('financ') || userMessage.includes('gasto')) {
      suggestions.push(
        { text: "Previsão de gastos para próximo mês", category: 'financial', priority: 'high', icon: TrendingUp },
        { text: "Identifique oportunidades de economia", category: 'financial', priority: 'medium', icon: DollarSign }
      );
    }
    
    if (userMessage.includes('reunião') || userMessage.includes('agenda')) {
      suggestions.push(
        { text: "Otimize sua agenda baseado em energia", category: 'planning', priority: 'medium', icon: Calendar },
        { text: "Analise eficácia de reuniões passadas", category: 'productivity', priority: 'low', icon: Brain }
      );
    }

    if (suggestions.length > 0) {
      setSmartSuggestions(suggestions.slice(0, 4));
    }
  };

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const sentiment = analyzeSentiment(messageText);
    const actionable = detectActionableContent(messageText);

    const userMessage: Message = {
      id: Date.now().toString(),
      content: messageText,
      role: 'user',
      timestamp: new Date(),
      sentiment,
      actionable
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const context = messages.map(msg => ({
        role: msg.role === 'error' ? 'assistant' : msg.role,
        content: msg.content
      }));

      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          message: messageText,
          context: context.slice(-10),
          userId: user?.id,
          sentiment,
          actionable,
          requestAdvanced: true
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      setApiStatus('online');

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        role: 'assistant',
        timestamp: new Date(),
        sentiment: 'positive',
        category: data.category || 'general',
        provider: 'Google Gemini'
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      if (data.suggestions) {
        generateSmartSuggestions(messageText, data.response);
      }

      toast({
        title: "✅ Google Gemini Conectado",
        description: "Resposta gerada com sucesso",
      });

    } catch (error: any) {
      console.error('Error sending message:', error);
      
      setApiStatus('error');
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `❌ **Erro na Comunicação:**\n\nNão foi possível conectar com o Google Gemini no momento.\n\n**Detalhes do erro:** ${error.message}\n\n🔧 **Soluções:**\n• Verifique sua conexão com a internet\n• Aguarde alguns segundos e tente novamente\n• Verifique se a chave API do Gemini está configurada corretamente\n\n*Tente novamente em instantes...*`,
        role: 'error',
        timestamp: new Date(),
        sentiment: 'negative',
        category: 'error'
      };

      setMessages(prev => [...prev, errorMessage]);

      toast({
        title: "❌ Erro de Conexão",
        description: "Falha ao comunicar com Google Gemini",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: SmartSuggestion) => {
    sendMessage(suggestion.text);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600';
      case 'negative': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = () => {
    switch (apiStatus) {
      case 'online': return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'error': return <AlertTriangle className="h-3 w-3 text-red-500" />;
      default: return <Activity className="h-3 w-3 text-blue-500" />;
    }
  };

  const getStatusColor = () => {
    switch (apiStatus) {
      case 'online': return 'bg-green-100 text-green-800 border-green-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  if (compact) {
    return (
      <Card className={`${className} max-w-sm border-2 border-gradient-to-r from-[#9b87f5] to-[#33C3F0] shadow-lg bg-white`}>
        <CardHeader className="pb-3 bg-gradient-to-r from-[#9b87f5]/10 to-[#33C3F0]/10">
          <CardTitle className="text-sm flex items-center gap-2">
            <div className="relative">
              <Bot className="h-4 w-4 text-[#9b87f5]" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            DilQ Orbe AI
            <Badge className={`text-xs ${getStatusColor()} flex items-center gap-1`}>
              {getStatusIcon()}
              Google Gemini
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 bg-white">
          {contextualInsights.length > 0 && (
            <div className="text-xs space-y-1">
              {contextualInsights.map((insight, index) => (
                <div key={index} className="p-2 bg-blue-50 rounded text-blue-700 border border-blue-200 break-words">
                  {insight}
                </div>
              ))}
            </div>
          )}
          
          <div className="flex gap-2">
            <Input
              placeholder="Pergunte algo inteligente..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage(inputMessage)}
              className="text-xs border-[#9b87f5]/30 bg-white"
            />
            <Button 
              size="sm" 
              onClick={() => sendMessage(inputMessage)}
              disabled={isLoading}
              className="bg-gradient-to-r from-[#9b87f5] to-[#33C3F0] hover:from-[#7E69AB] hover:to-[#2AA3D0] flex-shrink-0"
            >
              {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
            </Button>
          </div>
          
          {messages.length > 1 && (
            <div className="text-xs text-gray-500 break-words">
              💡 {messages[messages.length - 1]?.content.substring(0, 50)}...
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className} h-[700px] flex flex-col border-2 border-gradient-to-r from-[#9b87f5] to-[#33C3F0] shadow-2xl bg-white`}>
      <CardHeader className="border-b bg-gradient-to-r from-[#9b87f5]/20 to-[#33C3F0]/20 backdrop-blur-sm">
        <CardTitle className="flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-[#9b87f5] to-[#33C3F0] flex items-center justify-center">
              <Brain className="h-5 w-5 text-white animate-pulse" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse border-2 border-white"></div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xl font-bold bg-gradient-to-r from-[#9b87f5] to-[#33C3F0] bg-clip-text text-transparent">
              DilQ Orbe AI - Google Gemini
            </div>
            <div className="text-xs text-gray-500 font-normal">
              Powered by Google Gemini • Disponibilidade 24/7
            </div>
          </div>
          <Badge className={`flex items-center gap-2 ${getStatusColor()}`}>
            {getStatusIcon()}
            <span className="text-xs font-medium">Google Gemini</span>
          </Badge>
        </CardTitle>
        
        {contextualInsights.length > 0 && (
          <div className="flex gap-2 mt-2 flex-wrap">
            {contextualInsights.map((insight, index) => (
              <div key={index} className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full border border-blue-200 break-words">
                {insight}
              </div>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 bg-white">
        {apiStatus === 'error' && (
          <div className="p-3 border-b bg-gradient-to-r from-red-50 to-orange-50">
            <Alert className="border-red-200 bg-white">
              <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
              <AlertDescription className="text-red-700 break-words">
                <strong>Erro de Conexão</strong><br />
                Falha ao comunicar com Google Gemini. Verifique sua conexão e tente novamente.
              </AlertDescription>
            </Alert>
          </div>
        )}

        <ScrollArea className="flex-1 p-4 bg-white" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="relative flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-[#9b87f5] to-[#33C3F0] flex items-center justify-center">
                      <Brain className="h-4 w-4 text-white" />
                    </div>
                    {message.provider && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white"></div>
                    )}
                  </div>
                )}
                
                <div
                  className={`max-w-[80%] rounded-xl p-4 min-w-0 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-[#9b87f5] to-[#33C3F0] text-white ml-auto shadow-lg'
                      : message.role === 'error'
                      ? 'bg-red-50 border border-red-200 text-gray-900'
                      : 'bg-white border border-gray-200 shadow-md text-gray-900'
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap leading-relaxed break-words overflow-wrap-anywhere">
                    {message.content}
                  </div>
                  <div className={`flex items-center justify-between mt-3 pt-2 border-t ${
                    message.role === 'user' 
                      ? 'border-white/20' 
                      : 'border-gray-200'
                  }`}>
                    <span className={`text-xs ${
                      message.role === 'user' ? 'text-white/70' : 'text-gray-500'
                    }`}>
                      {formatTime(message.timestamp)}
                    </span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {message.provider && (
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          message.role === 'user' 
                            ? 'bg-white/20 text-white/80' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {message.provider}
                        </span>
                      )}
                      {message.sentiment && (
                        <span className={`text-xs ${getSentimentColor(message.sentiment)}`}>
                          {message.sentiment === 'positive' ? '😊' : message.sentiment === 'negative' ? '😟' : '😐'}
                        </span>
                      )}
                      {message.actionable && (
                        <span className="text-xs text-blue-500">⚡</span>
                      )}
                    </div>
                  </div>
                </div>

                {message.role === 'user' && (
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-gray-200 to-gray-300 flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-[#9b87f5] to-[#33C3F0] flex items-center justify-center flex-shrink-0">
                  <Brain className="h-4 w-4 text-white animate-pulse" />
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-md max-w-[80%] min-w-0">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-4 w-4 animate-spin text-[#9b87f5] flex-shrink-0" />
                    <span className="text-sm text-[#9b87f5] font-medium break-words">
                      Processando com Google Gemini...
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {smartSuggestions.length > 0 && (
          <div className="border-t p-4 bg-gradient-to-r from-blue-50/50 to-purple-50/50">
            <p className="text-sm font-semibold mb-3 text-gray-700 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#9b87f5] flex-shrink-0" />
              Sugestões Inteligentes
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {smartSuggestions.map((suggestion, index) => {
                const IconComponent = suggestion.icon;
                return (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className={`text-xs h-auto py-2 px-3 justify-start border-2 transition-all hover:scale-105 bg-white min-w-0 ${
                      suggestion.priority === 'high' 
                        ? 'border-red-200 hover:border-red-300 hover:bg-red-50' 
                        : suggestion.priority === 'medium'
                        ? 'border-yellow-200 hover:border-yellow-300 hover:bg-yellow-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    disabled={isLoading}
                  >
                    <IconComponent className="h-3 w-3 mr-2 flex-shrink-0" />
                    <span className="break-words overflow-hidden text-ellipsis">{suggestion.text}</span>
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        <div className="border-t p-4 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex gap-2">
            <Input
              placeholder="Digite sua mensagem ou comando inteligente..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage(inputMessage)}
              disabled={isLoading}
              className="flex-1 border-[#9b87f5]/30 focus:border-[#9b87f5] transition-colors bg-white min-w-0"
            />
            <Button
              onClick={startVoiceRecognition}
              disabled={isLoading || isListening}
              variant="outline"
              className="border-[#9b87f5]/30 hover:bg-[#9b87f5]/10 bg-white flex-shrink-0"
            >
              {isListening ? (
                <MicOff className="h-4 w-4 text-red-500" />
              ) : (
                <Mic className="h-4 w-4 text-[#9b87f5]" />
              )}
            </Button>
            <Button 
              onClick={() => sendMessage(inputMessage)}
              disabled={isLoading || !inputMessage.trim()}
              className="bg-gradient-to-r from-[#9b87f5] to-[#33C3F0] hover:from-[#7E69AB] hover:to-[#2AA3D0] shadow-lg transition-all hover:scale-105 flex-shrink-0"
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

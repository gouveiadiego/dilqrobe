import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { FileImage, Download, Wand2, Copy } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';

export const EbookTab = () => {
  const [inputText, setInputText] = useState('');
  const [formattedText, setFormattedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleFormatText = async () => {
    if (!inputText.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira algum texto para formatar.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('https://wgnvrxubwifcscrbkimm.supabase.co/functions/v1/generate-with-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnbnZyeHVid2lmY3NjcmJraW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg1MjYxNzAsImV4cCI6MjA1NDEwMjE3MH0.AwaBd1VRrzz_DvvDjJ3Ke7CJFoxl5XUB2chymhueybg`
        },
        body: JSON.stringify({
          prompt: `Transforme o seguinte texto em um formato elegante, futurista e bem estruturado para um ebook. 
          Use formatação em markdown para títulos, subtítulos, parágrafos bem organizados, listas quando apropriado, 
          e adicione elementos visuais como separadores e destaques. 
          Mantenha o conteúdo original mas torne-o mais atrativo e fácil de ler:

          ${inputText}`
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao formatar o texto');
      }

      const data = await response.json();
      setFormattedText(data.generatedText);
      toast({
        title: "Sucesso",
        description: "Texto formatado com sucesso!"
      });
    } catch (error) {
      console.error('Erro ao formatar texto:', error);
      toast({
        title: "Erro",
        description: "Erro ao formatar o texto. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(formattedText);
    toast({
      title: "Copiado",
      description: "Texto formatado copiado para a área de transferência!"
    });
  };

  const handleGeneratePDF = () => {
    if (!formattedText) {
      toast({
        title: "Erro",
        description: "Não há texto formatado para salvar em PDF.",
        variant: "destructive"
      });
      return;
    }

    try {
      const doc = new jsPDF();
      
      // Configurações básicas
      doc.setFont('helvetica');
      
      // Título
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Ebook Gerado', 20, 30);
      
      // Linha separadora
      doc.setDrawColor(100, 100, 100);
      doc.line(20, 35, 190, 35);
      
      // Conteúdo
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      
      // Quebrar o texto em linhas para caber na página
      const lines = doc.splitTextToSize(formattedText, 170);
      let y = 50;
      
      lines.forEach((line: string) => {
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, 20, y);
        y += 7;
      });
      
      // Salvar o PDF
      doc.save('ebook.pdf');
      
      toast({
        title: "PDF Gerado",
        description: "Ebook salvo como PDF com sucesso!"
      });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar PDF. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center space-x-3">
        <FileImage className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-dilq-accent to-dilq-teal bg-clip-text text-transparent">
            Criar Ebook
          </h1>
          <p className="text-gray-600">Transforme seu texto em um ebook elegante e bem formatado</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Wand2 className="h-5 w-5" />
              <span>Texto Original</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Cole ou digite seu texto aqui..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="min-h-[400px] resize-none"
            />
            <Button 
              onClick={handleFormatText}
              disabled={isLoading || !inputText.trim()}
              className="w-full bg-gradient-to-r from-dilq-accent to-dilq-teal hover:opacity-90"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Formatando...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Formatar Texto
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Output Section */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileImage className="h-5 w-5" />
                <span>Texto Formatado</span>
              </div>
              {formattedText && (
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyText}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copiar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGeneratePDF}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    PDF
                  </Button>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {formattedText ? (
              <div className="min-h-[400px] p-4 bg-gradient-to-br from-gray-50 to-white border rounded-lg">
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                    {formattedText}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="min-h-[400px] flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <FileImage className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>O texto formatado aparecerá aqui</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-blue-900 mb-2">Como usar:</h3>
          <ol className="list-decimal list-inside space-y-1 text-blue-800 text-sm">
            <li>Cole ou digite seu texto na área "Texto Original"</li>
            <li>Clique em "Formatar Texto" para transformá-lo em formato elegante</li>
            <li>Revise o resultado na área "Texto Formatado"</li>
            <li>Use "Copiar" para copiar o texto ou "PDF" para baixar como ebook</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
};
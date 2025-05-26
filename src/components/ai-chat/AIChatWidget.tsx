
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { MessageCircle, X } from "lucide-react";
import { AIChat } from "./AIChat";

export const AIChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Chat Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="h-14 w-14 rounded-full bg-gradient-to-r from-[#9b87f5] to-[#33C3F0] hover:from-[#7E69AB] hover:to-[#2AA3D0] shadow-lg"
          size="icon"
        >
          {isOpen ? (
            <X className="h-6 w-6 text-white" />
          ) : (
            <MessageCircle className="h-6 w-6 text-white" />
          )}
        </Button>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-40 w-96 max-w-[calc(100vw-2rem)] shadow-2xl">
          <AIChat className="border-2 border-[#9b87f5]/20" />
        </div>
      )}
    </>
  );
};

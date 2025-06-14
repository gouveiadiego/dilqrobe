
import React from "react";
import { Circle } from "lucide-react";

const FloatingChatButton = ({ onClick }: { onClick?: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label="Abrir chat ou ajuda"
    className="fixed bottom-6 right-6 z-40 shadow-lg focus:outline-none"
    style={{
      background: "linear-gradient(135deg, #6EE7B7 0%, #9B87F5 100%)"
    }}
  >
    <span className="w-14 h-14 flex items-center justify-center rounded-full text-white text-xl shadow-lg transition-transform duration-200 hover:scale-105">
      <Circle className="w-6 h-6" strokeWidth={2.3} />
    </span>
  </button>
);

export default FloatingChatButton;

import React, { useState, useRef, useEffect } from "react";
import { StorySegment } from "../types";
import Button from "./Button";
import { askTutor } from "../services/aiService";
import { playSfx } from "../services/audioService";

interface Message {
  role: "user" | "tutor";
  text: string;
}

interface ChatTutorProps {
  segment: StorySegment;
  onClose: () => void;
}

const ChatTutor: React.FC<ChatTutorProps> = ({ segment, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "tutor",
      text: "Olá! Sou seu tutor. Tem alguma dúvida sobre o texto ou o desafio atual?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput("");
    playSfx("CLICK");

    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setIsLoading(true);

    try {
      const response = await askTutor(segment, userMsg);
      playSfx("TYPE");
      setMessages((prev) => [...prev, { role: "tutor", text: response }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "tutor", text: "Erro ao conectar com o cérebro do tutor." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-quest-card w-full md:max-w-md md:rounded-2xl rounded-t-2xl border-t-2 md:border-2 border-quest-primary shadow-2xl flex flex-col h-[80vh] md:h-[600px]">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-gray-900/50 md:rounded-t-2xl">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-quest-primary flex items-center justify-center text-quest-dark font-bold font-retro">
              ?
            </div>
            <h3 className="font-retro text-quest-primary text-sm">Tutor IA</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2"
          >
            ✕
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-quest-dark/30">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-quest-primary text-quest-dark font-medium rounded-br-none"
                    : "bg-gray-700 text-gray-100 rounded-bl-none border border-gray-600"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-700 p-3 rounded-lg rounded-bl-none text-xs text-gray-400 animate-pulse">
                Pensando...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form
          onSubmit={handleSend}
          className="p-4 border-t border-gray-700 bg-gray-900/50 md:rounded-b-2xl"
        >
          <div className="flex space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pergunte sobre a frase ou desafio..."
              className="flex-1 bg-quest-dark border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-quest-primary text-sm"
            />
            <Button
              type="submit"
              variant="primary"
              disabled={isLoading || !input.trim()}
              className="px-4 py-2"
            >
              ➤
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatTutor;

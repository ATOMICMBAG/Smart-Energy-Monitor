/**
 * SmartAssistant Component
 * AI-gestützter Chat für Energie-Beratung
 * Unterscheidet zwischen Instant (Rule-Based) und AI-powered Antworten
 */

import { useState, useRef, useEffect } from "react";
import { askAssistant } from "../api/client";

const SmartAssistant = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "assistant",
      content:
        "Hallo! Frag mich alles über Strompreise, den aktuellen Energiemix oder wann du energieintensive Geräte nutzen solltest!",
      mode: "instant",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll zu neuen Nachrichten
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Beispiel-Fragen
  const exampleQuestions = [
    "Wann ist Strom am günstigsten?",
    "Wie hoch ist der CO2-Ausstoß gerade?",
    "Soll ich jetzt mein E-Auto laden?",
    "Wie viel Prozent erneuerbare Energie?",
  ];

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = {
      id: Date.now(),
      type: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await askAssistant(userMessage.content);
      const assistantMessage = {
        id: Date.now() + 1,
        type: "assistant",
        content: response.data.answer,
        mode: response.data.mode, // 'instant' oder 'ai'
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error("Error asking assistant:", err);
      const errorMessage = {
        id: Date.now() + 1,
        type: "assistant",
        content:
          "Entschuldigung, es gab einen Fehler. Bitte versuche es erneut.",
        mode: "error",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleExampleClick = (question) => {
    setInput(question);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg flex flex-col h-[600px]">
      {/* Header */}
      <div className="bg-white text-gray-800 p-4 rounded-t-lg">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <svg
              className="w-7 h-7"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold">Smart Energy Assistent</h2>
            <p className="text-sm text-gray-800">
              Dein KI-Berater für optimale Energienutzung
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.type === "user"
                  ? "bg-gray-600 text-white"
                  : "bg-white border border-gray-200 text-gray-800"
              }`}
            >
              {/* Message Content */}
              <div className="whitespace-pre-wrap break-words">
                {message.content}
              </div>

              {/* Badge & Timestamp */}
              <div
                className={`flex items-center gap-2 mt-2 text-xs ${
                  message.type === "user" ? "text-blue-100" : "text-gray-500"
                }`}
              >
                <span>{message.timestamp.toLocaleTimeString("de-DE")}</span>

                {message.type === "assistant" && message.mode === "instant" && (
                  <span className="flex items-center gap-1 bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-medium">
                    <svg
                      className="w-3 h-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Instant
                  </span>
                )}

                {message.type === "assistant" && message.mode === "ai" && (
                  <span className="flex items-center gap-1 bg-purple-100 text-yellow-800 px-2 py-0.5 rounded-full font-medium">
                    <svg
                      className="w-3 h-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    AI-powered
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-gray-500">
                <div className="flex space-x-1">
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  ></div>
                </div>
                <span className="text-sm">Denke nach...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Example Questions (nur wenn Chat leer ist) */}
      {messages.length === 1 && (
        <div className="px-4 pb-3 border-t border-gray-200 bg-gray-50">
          <div className="text-xs text-gray-600 mb-2 font-medium">
            Beispiel-Fragen:
          </div>
          <div className="grid grid-cols-2 gap-2">
            {exampleQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => handleExampleClick(question)}
                className="text-left text-xs bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg p-2 transition"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <form
        onSubmit={handleSendMessage}
        className="p-4 border-t border-gray-200 bg-white rounded-b-lg"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Stelle eine Frage zum Energieverbrauch..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition flex items-center gap-2 font-medium"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
            Senden
          </button>
        </div>
      </form>
    </div>
  );
};

export default SmartAssistant;

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import ChatLauncher from "@/components/chat/ChatLauncher";
import ChatWindow from "@/components/chat/ChatWindow";
import type { ChatMessageRecord, QuickAction } from "@/components/chat/types";
import { sendChatMessage } from "@/lib/aiInbox";
import { getLocaleFromPathname, type Locale } from "@/lib/i18n";

type ChatCopy = {
  assistantName: string;
  closeLabel: string;
  emptyStateLabel: string;
  inputPlaceholder: string;
  introLabel: string;
  launcherLabel: string;
  resetLabel: string;
  statusLabel: string;
  typingLabel: string;
  welcomeMessage: string;
  errorMessage: string;
  quickActions: QuickAction[];
};

const copy: Record<Locale, ChatCopy> = {
  en: {
    assistantName: "Carlos AI Assistant",
    closeLabel: "Close chat",
    emptyStateLabel:
      "I can help you explore featured projects, understand Carlos' profile, review services and open a contact conversation for new opportunities.",
    inputPlaceholder: "Write your message...",
    introLabel: "Welcome",
    launcherLabel: "Open Carlos AI Assistant",
    resetLabel: "Restart conversation",
    statusLabel: "Usually replies instantly",
    typingLabel: "Assistant is typing",
    welcomeMessage:
      "Hi, I'm here to guide you through Carlos' projects, experience, services and the best way to get in touch if you have an opportunity in mind.",
    errorMessage:
      "No he podido conectar con el asistente ahora mismo. Si quieres, puedes intentarlo de nuevo en unos segundos o usar la página de contacto.",
    quickActions: [
      { id: "projects", label: "View projects", prompt: "Show me Carlos' most relevant projects and explain why they stand out." },
      { id: "about", label: "About", prompt: "Tell me about Carlos' professional profile, experience and strongest differentiators." },
      {
        id: "services",
        label: "Services",
        prompt: "What services does Carlos offer around AI, web content, digital workflows or automation?",
      },
      {
        id: "contact",
        label: "Contact",
        prompt: "I would like to contact Carlos to discuss an opportunity or project. What is the best next step?",
      },
    ],
  },
  es: {
    assistantName: "Carlos AI Assistant",
    closeLabel: "Cerrar chat",
    emptyStateLabel:
      "Puedo ayudarte a descubrir proyectos destacados, entender mejor el perfil de Carlos, revisar servicios y abrir una conversación de contacto para nuevas oportunidades.",
    inputPlaceholder: "Escribe tu mensaje...",
    introLabel: "Bienvenida",
    launcherLabel: "Abrir Carlos AI Assistant",
    resetLabel: "Reiniciar conversación",
    statusLabel: "Normalmente responde al instante",
    typingLabel: "El asistente está escribiendo",
    welcomeMessage:
      "Hola, puedo orientarte sobre proyectos, experiencia, servicios y la mejor forma de contactar con Carlos si tienes una oportunidad o una idea en mente.",
    errorMessage:
      "No he podido conectar con el asistente ahora mismo. Si quieres, puedes intentarlo de nuevo en unos segundos o usar la página de contacto.",
    quickActions: [
      { id: "projects", label: "Ver proyectos", prompt: "Muéstrame tus proyectos más destacados." },
      { id: "about", label: "Sobre mí", prompt: "Cuéntame tu perfil profesional y experiencia." },
      {
        id: "services",
        label: "Servicios",
        prompt: "¿Qué servicios ofreces relacionados con IA, contenido web o automatización?",
      },
      {
        id: "contact",
        label: "Contactar",
        prompt: "Quiero contactar contigo para hablar de una oportunidad o proyecto.",
      },
    ],
  },
};

const STORAGE_PREFIX = "portfolio-chat-widget";

function createMessage(role: ChatMessageRecord["role"], content: string, id?: string): ChatMessageRecord {
  return {
    id: id ?? `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
  };
}

function getInitialMessages(locale: Locale) {
  return [createMessage("assistant", copy[locale].welcomeMessage, `assistant-welcome-${locale}`)];
}

export default function ChatWidget() {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const text = copy[locale];
  const storageKey = `${STORAGE_PREFIX}:${locale}`;
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<ChatMessageRecord[]>(() => getInitialMessages(locale));

  const showQuickActions = useMemo(() => messages.length <= 1 && !messages.some((message) => message.role === "user"), [messages]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (!saved) {
        setMessages(getInitialMessages(locale));
        return;
      }

      const parsed = JSON.parse(saved) as ChatMessageRecord[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        setMessages(parsed);
        return;
      }
    } catch {
      // Ignore malformed localStorage and restore the default state.
    }

    setMessages(getInitialMessages(locale));
  }, [locale, storageKey]);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(messages));
  }, [messages, storageKey]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    });
  }, [isLoading, messages, isOpen]);

  async function submitMessage(content: string) {
    const trimmed = content.trim();
    if (!trimmed || isLoading) return;

    const userMessage = createMessage("user", trimmed);
    setMessages((current) => [...current, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const reply = await sendChatMessage(trimmed);
      setMessages((current) => [...current, createMessage("assistant", reply)]);
    } catch {
      setMessages((current) => [...current, createMessage("assistant", text.errorMessage)]);
    } finally {
      setIsLoading(false);
      setIsOpen(true);
    }
  }

  function handleReset() {
    setMessages(getInitialMessages(locale));
    setInputValue("");
    setIsLoading(false);
    window.localStorage.removeItem(storageKey);
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6">
      <ChatWindow
        assistantName={text.assistantName}
        closeLabel={text.closeLabel}
        emptyStateLabel={text.emptyStateLabel}
        inputPlaceholder={text.inputPlaceholder}
        introLabel={text.introLabel}
        isLoading={isLoading}
        isOpen={isOpen}
        messages={messages}
        onChangeInput={setInputValue}
        onClose={() => setIsOpen(false)}
        onReset={handleReset}
        onSelectQuickAction={(action) => {
          setIsOpen(true);
          void submitMessage(action.prompt);
        }}
        onSubmit={() => void submitMessage(inputValue)}
        quickActions={text.quickActions}
        resetLabel={text.resetLabel}
        scrollContainerRef={scrollContainerRef}
        showQuickActions={showQuickActions}
        statusLabel={text.statusLabel}
        typingLabel={text.typingLabel}
        value={inputValue}
      />

      <ChatLauncher isOpen={isOpen} onClick={() => setIsOpen((current) => !current)} label={text.launcherLabel} />
    </div>
  );
}

"use client";

import { useState, useRef, useCallback } from "react";
import { Mic, Square } from "lucide-react";
import type { Editor } from "@tiptap/react";
import toast from "react-hot-toast";

interface Props {
  editor: Editor | null;
  btnClass: string;
  activeClass: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SR = any;

export function VoiceButton({ editor, btnClass, activeClass }: Props) {
  const [listening, setListening] = useState(false);
  const recogRef = useRef<SR>(null);

  const supported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const start = useCallback(() => {
    if (!editor || !supported) {
      toast.error("Voice input not supported in this browser.");
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SRClass: SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    const r: SR = new SRClass();
    r.continuous = true;
    r.interimResults = false;
    r.lang = "en-US";

    r.onstart  = () => { setListening(true);  toast("Listening…", { icon: "🎤", id: "voice" }); };
    r.onend    = () => { setListening(false); toast.dismiss("voice"); };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    r.onerror  = (e: any) => {
      if (e.error !== "aborted") toast.error(`Voice error: ${e.error}`);
      setListening(false);
      toast.dismiss("voice");
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    r.onresult = (e: any) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          const text = (e.results[i][0].transcript as string).trimStart();
          editor.chain().focus().insertContent(text + " ").run();
        }
      }
    };

    recogRef.current = r;
    r.start();
  }, [editor, supported]);

  const stop = useCallback(() => {
    recogRef.current?.stop();
    recogRef.current = null;
  }, []);

  if (!supported) return null;

  return (
    <button
      type="button"
      className={`${btnClass} ${listening ? activeClass : ""}`}
      onClick={listening ? stop : start}
      aria-label={listening ? "Stop voice input" : "Voice to text"}
      title={listening ? "Stop recording" : "Voice to text (click to start)"}
    >
      {listening ? <Square size={15} /> : <Mic size={15} />}
    </button>
  );
}

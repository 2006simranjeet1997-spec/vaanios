
import { useState } from "react";
import {
  Mic,
  MicOff,
  Volume2,
  Languages,
  AudioLines,
  Sparkles,
  MessageSquare,
} from "lucide-react";

function VoiceAssistant() {
  const [language, setLanguage] = useState("Hindi");
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");

  const handleDemo = () => {
    setTranscript(
      "Mera order abhi tak deliver nahi hua hai. Please meri help kijiye."
    );

    setResponse(
      "Namaste! I'm sorry your order has been delayed. Let me help you check its delivery status."
    );
  };

  return (
    <div className="space-y-6 text-slate-800">

      {/* Heading */}
      <div>
        <h2 className="text-2xl font-bold md:text-3xl">
          Voice Assistant
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Interact with your AI-powered multilingual voice assistant.
        </p>
      </div>

      {/* Language Selection */}
      <section className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-violet-50 p-3 text-violet-600">
            <Languages size={22} />
          </div>
          <div>
            <h3 className="font-semibold">Conversation Language</h3>
            <p className="text-sm text-slate-400">
              Choose your preferred language
            </p>
          </div>
        </div>

        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-500"
        >
          <option>Hindi</option>
          <option>English</option>
          <option>Hinglish</option>
          <option>Punjabi</option>
        </select>
      </section>

      {/* Voice Assistant Main Card */}
      <section className="rounded-2xl bg-gradient-to-r from-violet-700 to-indigo-600 p-8 text-center text-white">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-white/15">
          <AudioLines size={38} />
        </div>

        <h3 className="text-2xl font-bold">
          Vaani AI Assistant
        </h3>

        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-violet-100">
          Your multilingual AI assistant is ready to help customers
          with their queries.
        </p>

        <button
          onClick={handleDemo}
          className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-violet-700 transition hover:bg-violet-50"
        >
          <Mic size={19} />
          Try Demo Conversation
        </button>

        <p className="mt-4 text-xs text-violet-200">
          Demo interaction • Microphone integration coming soon
        </p>
      </section>

      {/* Conversation Panels */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

        {/* Speech to Text */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-violet-50 p-3 text-violet-600">
              <Mic size={21} />
            </div>
            <div>
              <h3 className="font-bold">Speech to Text</h3>
              <p className="text-xs text-slate-400">
                Prisma STT integration
              </p>
            </div>
          </div>

          <label className="mb-2 block text-sm font-medium text-slate-600">
            Transcribed Customer Speech
          </label>

          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Your transcribed speech will appear here..."
            className="min-h-36 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm outline-none focus:border-violet-500"
          />

          <p className="mt-3 text-xs text-slate-400">
            Selected language: {language}
          </p>
        </section>

        {/* Text to Speech */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
              <Volume2 size={21} />
            </div>
            <div>
              <h3 className="font-bold">AI Voice Response</h3>
              <p className="text-xs text-slate-400">
                Timbre TTS integration
              </p>
            </div>
          </div>

          <label className="mb-2 block text-sm font-medium text-slate-600">
            Generated AI Response
          </label>

          <textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Your AI response will appear here..."
            className="min-h-36 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm outline-none focus:border-violet-500"
          />

          <button
            disabled={!response}
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Volume2 size={17} />
            Generate Voice
          </button>
        </section>
      </div>

      {/* Integration Status */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles size={19} className="text-violet-600" />
          <h3 className="font-bold">AI Model Integrations</h3>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
            <div>
              <p className="font-semibold">Prisma</p>
              <p className="text-xs text-slate-400">Speech to Text</p>
            </div>
            <span className="text-xs font-medium text-amber-600">
              Integration Pending
            </span>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
            <div>
              <p className="font-semibold">Timbre</p>
              <p className="text-xs text-slate-400">Text to Speech</p>
            </div>
            <span className="text-xs font-medium text-amber-600">
              Integration Pending
            </span>
          </div>
        </div>
      </section>

    </div>
  );
}

export default VoiceAssistant;

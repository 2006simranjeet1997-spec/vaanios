
import { useState } from "react";
import {
  Mic,
  Volume2,
  Languages,
  AudioLines,
  Sparkles,
  Upload,
  Loader2,
  CheckCircle2,
} from "lucide-react";

function VoiceAssistant() {
  const [language, setLanguage] = useState("Hindi");
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [audioFile, setAudioFile] = useState(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState("");
  const [detectedLanguage, setDetectedLanguage] = useState("");

  // Real Prisma V3 integration
  const handleTranscription = async () => {
    if (!audioFile) {
      setError("Please select an audio file first.");
      return;
    }

    setIsTranscribing(true);
    setError("");
    setTranscript("");
    setDetectedLanguage("");

    try {
      const formData = new FormData();
      formData.append("audio", audioFile);

      const result = await fetch("http://localhost:5001/api/stt", {
        method: "POST",
        body: formData,
      });

      const data = await result.json();

      if (!result.ok || !data.success) {
        throw new Error(data.message || "Transcription failed.");
      }

      setTranscript(data.transcript || "");
      setDetectedLanguage(data.detected_language_code || "");
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setIsTranscribing(false);
    }
  };

  // Sample demo conversation
  const handleDemo = () => {
    setTranscript(
      "Mera order abhi tak deliver nahi hua hai. Please meri help kijiye."
    );

    setResponse(
      "Namaste! I'm sorry your order has been delayed. Let me help you check its delivery status."
    );

    setError("");
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

      {/* Main Assistant Card */}
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
          Try Sample Conversation
        </button>

        <p className="mt-4 text-xs text-violet-200">
          Sample conversation • Real Prisma transcription available below
        </p>
      </section>

      {/* Speech to Text */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-xl bg-violet-50 p-3 text-violet-600">
            <Mic size={21} />
          </div>
          <div>
            <h3 className="font-bold">Speech to Text</h3>
            <p className="text-xs text-slate-400">
              Powered by Gnani Prisma V3
            </p>
          </div>
        </div>

        {/* Audio Upload */}
        <label className="mb-2 block text-sm font-medium text-slate-600">
          Upload your voice recording
        </label>

        <div className="rounded-xl border-2 border-dashed border-violet-200 bg-violet-50/50 p-5">
          <input
            type="file"
            accept="audio/*"
            onChange={(e) => {
              setAudioFile(e.target.files[0] || null);
              setError("");
            }}
            className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-violet-600 file:px-4 file:py-2 file:font-medium file:text-white hover:file:bg-violet-700"
          />

          {audioFile && (
            <p className="mt-3 text-sm text-slate-600">
              Selected: {audioFile.name}
            </p>
          )}
        </div>

        <button
          onClick={handleTranscription}
          disabled={!audioFile || isTranscribing}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isTranscribing ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Transcribing...
            </>
          ) : (
            <>
              <AudioLines size={18} />
              Transcribe Audio
            </>
          )}
        </button>

        {error && (
          <p className="mt-3 text-sm text-red-600">
            {error}
          </p>
        )}

        {/* Transcript */}
        <div className="mt-6">
          <label className="mb-2 block text-sm font-medium text-slate-600">
            Transcribed Customer Speech
          </label>

          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Your actual transcription will appear here..."
            className="min-h-36 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm outline-none focus:border-violet-500"
          />

          {detectedLanguage && (
            <p className="mt-2 flex items-center gap-2 text-xs text-green-600">
              <CheckCircle2 size={15} />
              Detected language: {detectedLanguage}
            </p>
          )}

          <p className="mt-3 text-xs text-slate-400">
            Selected language: {language}
          </p>
        </div>
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

      {/* Integration Status */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles size={19} className="text-violet-600" />
          <h3 className="font-bold">AI Model Integrations</h3>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
            <div>
              <p className="font-semibold">Prisma V3</p>
              <p className="text-xs text-slate-400">Speech to Text</p>
            </div>
            <span className="text-xs font-medium text-green-600">
              Connected
            </span>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
            <div>
              <p className="font-semibold">Timbre</p>
              <p className="text-xs text-slate-400">Text to Speech</p>
            </div>
            <span className="text-xs font-medium text-amber-600">
              Pending
            </span>
          </div>
        </div>
      </section>

    </div>
  );
}

export default VoiceAssistant;

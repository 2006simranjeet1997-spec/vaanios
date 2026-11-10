
import { useState, useRef } from "react";
import {
  Mic,
  Volume2,
  Languages,
  AudioLines,
  Sparkles,
  Loader2,
  CheckCircle2,
} from "lucide-react";

function VoiceAssistant() {
  const [language, setLanguage] = useState("Hindi");
  const [customerName, setCustomerName] = useState("");
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [audioFile, setAudioFile] = useState(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState("");
  const [detectedLanguage, setDetectedLanguage] = useState("");

  const [isUnderstanding, setIsUnderstanding] = useState(false);
  const [complaintAnalysis, setComplaintAnalysis] = useState(null);

  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);
  const [generatedAudio, setGeneratedAudio] = useState("");

  // Live recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  // Clear generated audio safely
  const clearGeneratedAudio = () => {
    if (generatedAudio) {
      URL.revokeObjectURL(generatedAudio);
      setGeneratedAudio("");
    }
  };

  // Start microphone recording
  const startRecording = async () => {
    try {
      setError("");
      setTranscript("");
      setDetectedLanguage("");
      setComplaintAnalysis(null);
      setResponse("");
      setRecordedAudio(null);
      setAudioFile(null);
      setRecordingTime(0);
      clearGeneratedAudio();

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const supportedTypes = [
        "audio/mp4",
        "audio/webm;codecs=opus",
        "audio/webm",
      ];

      const selectedType = supportedTypes.find((type) =>
        MediaRecorder.isTypeSupported(type)
      );

      const mediaRecorder = selectedType
        ? new MediaRecorder(stream, { mimeType: selectedType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType || "audio/webm",
        });

        const extension = audioBlob.type.includes("mp4")
          ? "m4a"
          : "webm";

        const audioUrl = URL.createObjectURL(audioBlob);

        const recordedFile = new File(
          [audioBlob],
          `vaanios-recording-${Date.now()}.${extension}`,
          { type: audioBlob.type }
        );

        setRecordedAudio(audioUrl);
        setAudioFile(recordedFile);

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.onerror = () => {
        setError("Recording failed. Please try again.");
        stream.getTracks().forEach((track) => track.stop());
        setIsRecording(false);
        clearInterval(timerRef.current);
      };

      mediaRecorder.start();
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setRecordingTime((previous) => previous + 1);
      }, 1000);
    } catch (err) {
      setError(
        "Microphone access denied or unavailable. Please check your browser permissions."
      );
    }
  };

  // Stop microphone recording
  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }

    clearInterval(timerRef.current);
    setIsRecording(false);
  };

  // Prisma V3 - Speech to Text
  const handleTranscription = async () => {
    if (!audioFile) {
      setError("Please select or record an audio file first.");
      return;
    }

    setIsTranscribing(true);
    setError("");
    setTranscript("");
    setDetectedLanguage("");
    setComplaintAnalysis(null);
    setResponse("");
    clearGeneratedAudio();

    try {
      const formData = new FormData();
      formData.append("audio", audioFile);

      const result = await fetch(
        `${import.meta.env.VITE_API_URL}/api/stt`,
        {
          method: "POST",
          credentials: "include",
          body: formData,
        }
      );

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

  // VaaniOS - Understand Customer Complaint
  const handleUnderstandComplaint = async () => {
    if (!transcript.trim()) {
      setError("Please transcribe or enter the customer's message first.");
      return;
    }

    setIsUnderstanding(true);
    setError("");
    setComplaintAnalysis(null);

    try {
      const result = await fetch(
        `${import.meta.env.VITE_API_URL}/api/understand`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            transcript: transcript.trim(),
            customerName: customerName.trim() || "Guest",
          }),
        }
      );

      const data = await result.json();

      if (!result.ok || !data.success) {
        throw new Error(
          data.message || "Could not understand the complaint."
        );
      }

      setComplaintAnalysis(data.analysis);
      setResponse(data.response || "");
      clearGeneratedAudio();
    } catch (err) {
      setError(
        err.message ||
          "Something went wrong while understanding the complaint."
      );
    } finally {
      setIsUnderstanding(false);
    }
  };

  // Timbre V2.5 - Text to Speech
  const handleGenerateVoice = async () => {
    if (!response.trim()) {
      setError("Please generate an AI response first.");
      return;
    }

    setIsGeneratingVoice(true);
    setError("");

    try {
      const languageSettings = {
        Hindi: { language: "hi-IN", voice: "Nalini" },
        English: { language: "en-IN", voice: "Kaveri" },
        Hinglish: { language: "hi-en", voice: "Poorvi" },
        Punjabi: { language: "pa-IN", voice: "Nalini" },
      };

      const selectedSettings =
        languageSettings[language] || languageSettings.Hindi;

      const result = await fetch(
        `${import.meta.env.VITE_API_URL}/api/tts`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: response.trim(),
            language: selectedSettings.language,
            voice: selectedSettings.voice,
          }),
        }
      );

      if (!result.ok) {
        let message = "Voice generation failed.";

        try {
          const data = await result.json();
          message = data.message || data.details || message;
        } catch {
          // Keep default error message.
        }

        throw new Error(message);
      }

      const audioBlob = await result.blob();

      if (!audioBlob.size) {
        throw new Error("Timbre returned an empty audio file.");
      }

      clearGeneratedAudio();
      setGeneratedAudio(URL.createObjectURL(audioBlob));
    } catch (err) {
      setError(
        err.message || "Something went wrong while generating voice."
      );
    } finally {
      setIsGeneratingVoice(false);
    }
  };

  // Sample demo conversation
  const handleDemo = () => {
    setTranscript(
      "Mera order abhi tak deliver nahi hua hai. Please meri help kijiye."
    );

    setResponse("");
    setComplaintAnalysis(null);
    setDetectedLanguage("");
    setError("");
    clearGeneratedAudio();
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
          type="button"
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

        {/* Customer Name */}
        <div className="mb-6">
          <label
            htmlFor="customerName"
            className="mb-2 block text-sm font-medium text-slate-600"
          >
            Customer Name
          </label>

          <input
            id="customerName"
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Enter customer's name"
            maxLength={100}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-violet-500"
          />

          <p className="mt-1 text-xs text-slate-400">
            If left empty, the customer will be saved as Guest.
          </p>
        </div>

        {/* Live Microphone Recording */}
        <div className="mb-6 rounded-xl border border-violet-200 bg-violet-50/50 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h4 className="font-semibold text-slate-800">
                Record Live Audio
              </h4>

              <p className="mt-1 text-sm text-slate-500">
                Speak directly into your microphone.
              </p>
            </div>

            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition ${
                isRecording
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-violet-600 hover:bg-violet-700"
              }`}
            >
              <Mic size={18} />
              {isRecording ? "Stop Recording" : "Start Recording"}
            </button>
          </div>

          {isRecording && (
            <p className="mt-4 text-sm font-medium text-red-600">
              ● Recording... {recordingTime}s
            </p>
          )}

          {recordedAudio && (
            <div className="mt-4">
              <p className="mb-2 text-sm font-medium text-green-700">
                Recording completed!
              </p>

              <audio
                controls
                src={recordedAudio}
                className="w-full"
              />
            </div>
          )}
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
              setRecordedAudio(null);
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
          type="button"
          onClick={handleTranscription}
          disabled={!audioFile || isTranscribing || isRecording}
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
            onChange={(e) => {
              setTranscript(e.target.value);
              setComplaintAnalysis(null);
              setResponse("");
              clearGeneratedAudio();
            }}
            placeholder="Your actual transcription will appear here..."
            className="min-h-36 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm outline-none focus:border-violet-500"
          />

          {detectedLanguage && (
            <p className="mt-2 flex items-center gap-2 text-xs text-green-600">
              <CheckCircle2 size={15} />
              Detected language: {detectedLanguage}
            </p>
          )}

          {/* Understand Complaint Button */}
          <button
            type="button"
            onClick={handleUnderstandComplaint}
            disabled={!transcript.trim() || isUnderstanding}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isUnderstanding ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Understanding Complaint...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Understand Complaint
              </>
            )}
          </button>

          {/* Complaint Analysis */}
          {complaintAnalysis && (
            <div className="mt-5 rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
              <h4 className="mb-3 font-semibold text-slate-800">
                Complaint Analysis
              </h4>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-slate-500">Category</p>
                  <p className="font-medium text-slate-800">
                    {complaintAnalysis.category}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">Priority</p>
                  <p className="font-medium text-slate-800">
                    {complaintAnalysis.priority}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">Order ID</p>
                  <p className="font-medium text-slate-800">
                    {complaintAnalysis.orderId || "Not provided"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">Requested Action</p>
                  <p className="font-medium text-slate-800">
                    {complaintAnalysis.requestedAction}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">Detected Language</p>
                  <p className="font-medium text-slate-800">
                    {complaintAnalysis.language}
                  </p>
                </div>
              </div>

              <p className="mt-3 border-t border-indigo-100 pt-3 text-sm text-slate-600">
                {complaintAnalysis.summary}
              </p>

              {complaintAnalysis.clarificationNeeded && (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="font-semibold text-amber-800">
                    Additional Information Required
                  </p>

                  <p className="mt-2 text-sm text-amber-700">
                    {complaintAnalysis.clarificationMessage}
                  </p>
                </div>
              )}
            </div>
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
          type="button"
          onClick={handleGenerateVoice}
          disabled={!response.trim() || isGeneratingVoice}
          className="mt-3 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isGeneratingVoice ? (
            <>
              <Loader2 size={17} className="animate-spin" />
              Generating Voice...
            </>
          ) : (
            <>
              <Volume2 size={17} />
              Generate Voice
            </>
          )}
        </button>

        {generatedAudio && (
          <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4">
            <p className="mb-2 flex items-center gap-2 text-sm font-medium text-green-700">
              <CheckCircle2 size={16} />
              Voice generated successfully!
            </p>

            <audio
              controls
              src={generatedAudio}
              className="w-full"
            />
          </div>
        )}

        {error && (
          <p className="mt-3 text-sm text-red-600">
            {error}
          </p>
        )}
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
              <p className="font-semibold">Timbre V2.5</p>
              <p className="text-xs text-slate-400">Text to Speech</p>
            </div>

            <span className="text-xs font-medium text-green-600">
              Connected
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}

export default VoiceAssistant;

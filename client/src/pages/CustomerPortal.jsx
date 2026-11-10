
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Mic,
  Square,
  Upload,
  Send,
  Volume2,
  Headphones,
  ShieldCheck,
  Globe,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  ArrowRight,
  Ticket,
  AlertTriangle,
  MessageCircle,
  UserRound,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

const languages = [
  { label: "Hindi", value: "Hindi", code: "hi-IN", voice: "Nalini" },
  { label: "English", value: "English", code: "en-IN", voice: "Kaveri" },
  { label: "Hinglish", value: "Hinglish", code: "hi-IN", voice: "Poorvi" },
  { label: "Punjabi", value: "Punjabi", code: "pa-IN", voice: "Nalini" },
];

function CustomerPortal() {
  const navigate = useNavigate();

  const [customerName, setCustomerName] = useState("");
  const [language, setLanguage] = useState("Hindi");
  const [transcript, setTranscript] = useState("");
  const [audioFile, setAudioFile] = useState(null);

  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [audioUrl, setAudioUrl] = useState("");

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const fileInputRef = useRef(null);
  const audioRef = useRef(null);
  const streamRef = useRef(null);

  const selectedLanguage =
    languages.find((item) => item.value === language) || languages[0];

  const analysis = result?.analysis;

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }

      streamRef.current?.getTracks().forEach((track) => track.stop());

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }

    setIsSpeaking(false);
  };

  const clearAudio = () => {
    stopAudio();

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl("");
    }
  };

  const clearResult = () => {
    setResult(null);
    clearAudio();
  };

  const handleSessionError = (response) => {
    if (response.status === 401) {
      navigate("/customer/login");
      return true;
    }

    return false;
  };

  const startRecording = async () => {
    try {
      setError("");
      clearResult();

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Your browser does not support audio recording.");
      }

      if (typeof MediaRecorder === "undefined") {
        throw new Error("Audio recording is not supported in this browser.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "";

      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined
      );

      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });

        if (blob.size > 0) {
          const file = new File([blob], "customer-recording.webm", {
            type: blob.type,
          });

          setAudioFile(file);
          setTranscript("");
        } else {
          setError("No audio was recorded. Please try again.");
        }

        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      setError(err.message || "Could not access your microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("audio/")) {
      setError("Please select a valid audio file.");
      event.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Audio file must be smaller than 10 MB.");
      event.target.value = "";
      return;
    }

    clearResult();
    setError("");
    setAudioFile(file);
    setTranscript("");
  };

  const transcribeAudio = async () => {
    if (!audioFile) {
      setError("Please record or upload an audio file first.");
      return;
    }

    try {
      setIsTranscribing(true);
      setError("");

      const formData = new FormData();
      formData.append("audio", audioFile);

      const response = await fetch(`${API_URL}/api/customer/stt`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (handleSessionError(response)) return;

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Speech recognition failed.");
      }

      const recognizedText =
        data.transcript ||
        data.text ||
        data.result?.transcript ||
        data.data?.transcript ||
        "";

      if (!recognizedText.trim()) {
        throw new Error("No speech was detected. Please try recording again.");
      }

      setTranscript(recognizedText);
      setAudioFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      setError(err.message || "Could not convert your audio to text.");
    } finally {
      setIsTranscribing(false);
    }
  };

  const submitComplaint = async (event) => {
    event.preventDefault();

    if (!transcript.trim()) {
      setError("Please tell us about your concern first.");
      return;
    }

    if (transcript.trim().length > 5000) {
      setError("Your complaint must be less than 5000 characters.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      clearResult();

      const response = await fetch(`${API_URL}/api/customer/understand`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          transcript: transcript.trim(),
          customerName: customerName.trim() || "Customer",
          language,
        }),
      });

      if (handleSessionError(response)) return;

      const data = await response.json();

      console.log("FULL COMPLAINT API RESPONSE:", data);
      console.log("AI RESPONSE FIELD:", data.response);

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not submit your complaint.");
      }

      setResult(data);
      setAudioFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      console.error("Complaint submission error:", err);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // TEXT-TO-SPEECH
  const playResponse = async () => {
    console.log("1. LISTEN BUTTON CLICKED");
    console.log("2. FULL RESULT:", result);
    console.log("3. RESPONSE TEXT:", result?.response);

    const responseText =
      typeof result?.response === "string"
        ? result.response.trim()
        : "";

    if (!responseText) {
      console.error("AI response is missing.");
      setError("The AI response is unavailable. Please submit the complaint again.");
      return;
    }

    try {
      stopAudio();
      setError("");
      setIsSpeaking(true);

      console.log("4. STARTING TTS");
      console.log("5. API URL:", API_URL);
      console.log("6. LANGUAGE:", selectedLanguage.code);
      console.log("7. VOICE:", selectedLanguage.voice);

      const response = await fetch(`${API_URL}/api/customer/tts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          text: responseText,
          language: selectedLanguage.code,
          voice: selectedLanguage.voice,
        }),
      });

      console.log("8. TTS STATUS:", response.status);

      if (handleSessionError(response)) {
        setIsSpeaking(false);
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Voice generation failed.");
      }

      const contentType = response.headers.get("content-type") || "";
      const blob = await response.blob();

      console.log("9. AUDIO SIZE:", blob.size);
      console.log("10. CONTENT TYPE:", contentType);

      if (!blob.size) {
        throw new Error("Gnani returned an empty audio response.");
      }

      if (
        contentType.includes("application/json") ||
        contentType.includes("text/")
      ) {
        throw new Error(
          "Gnani returned text instead of audio. Check the backend TTS response format."
        );
      }

      const newAudioUrl = URL.createObjectURL(blob);

      setAudioUrl((oldUrl) => {
        if (oldUrl) URL.revokeObjectURL(oldUrl);
        return newAudioUrl;
      });

      const audio = new Audio(newAudioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setIsSpeaking(false);
        audioRef.current = null;
      };

      audio.onerror = () => {
        setIsSpeaking(false);
        audioRef.current = null;
        setError("Audio was received, but your browser could not play it.");
      };

      await audio.play();

      console.log("11. AUDIO PLAYBACK STARTED");
    } catch (err) {
      console.error("VAANIOS TTS ERROR:", err);
      setIsSpeaking(false);
      setError(err.message || "Could not play the voice response.");
    }
  };

  const resetForm = () => {
    clearAudio();

    setCustomerName("");
    setTranscript("");
    setAudioFile(null);
    setResult(null);
    setError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getResultHeading = () => {
    if (analysis?.escalationNeeded) {
      return {
        title: "Your complaint has been escalated",
        description:
          "Your request requires assistance from our human support team.",
        icon: AlertTriangle,
        color: "amber",
      };
    }

    if (analysis?.clarificationNeeded) {
      return {
        title: "We need a little more information",
        description:
          "Your ticket has been created. Please review the clarification request below.",
        icon: MessageCircle,
        color: "blue",
      };
    }

    return {
      title: "Complaint submitted successfully!",
      description:
        "Your request has been received and recorded by VaaniOS.",
      icon: CheckCircle2,
      color: "emerald",
    };
  };

  const resultHeading = getResultHeading();
  const ResultIcon = resultHeading.icon;

  const headingStyles = {
    emerald: {
      container: "bg-emerald-100 text-emerald-700",
      border: "border-emerald-200",
      label: "text-emerald-700",
    },
    amber: {
      container: "bg-amber-100 text-amber-700",
      border: "border-amber-200",
      label: "text-amber-700",
    },
    blue: {
      container: "bg-blue-100 text-blue-700",
      border: "border-blue-200",
      label: "text-blue-700",
    },
  };

  const currentStyle = headingStyles[resultHeading.color];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              Vaani<span className="text-violet-700">OS</span>
            </h1>
            <p className="text-xs font-medium tracking-wider text-slate-500">
              CUSTOMER SUPPORT
            </p>
          </div>

          <Link
            to="/customer/dashboard"
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-violet-300 hover:text-violet-700"
          >
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 py-10">
        <div className="mb-9 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
            <Headphones size={28} />
          </div>

          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-violet-700">
            We're here to help
          </p>

          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            How can we help you today?
          </h2>

          <p className="mx-auto mt-3 max-w-xl text-slate-500">
            Tell us your concern in your preferred language. Speak or type —
            our AI assistant is ready to help.
          </p>
        </div>

        <form
          onSubmit={submitComplaint}
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9"
        >
          <div className="mb-7 grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                <UserRound size={15} className="mr-1 inline" />
                Your name
              </label>

              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter your name"
                maxLength={80}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                <Globe size={15} className="mr-1 inline" />
                Preferred language
              </label>

              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
              >
                {languages.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-2xl border border-dashed border-violet-200 bg-violet-50/60 p-6 text-center sm:p-9">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white text-violet-700 shadow-sm">
              <Mic size={30} />
            </div>

            <h3 className="text-lg font-bold">Speak your concern</h3>

            <p className="mt-1 text-sm text-slate-500">
              Record your voice or upload an existing audio file.
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {!isRecording ? (
                <button
                  type="button"
                  onClick={startRecording}
                  disabled={isTranscribing || isSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-800 disabled:opacity-50"
                >
                  <Mic size={17} />
                  Start Recording
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white"
                >
                  <Square size={16} />
                  Stop Recording
                </button>
              )}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isRecording || isTranscribing || isSubmitting}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-violet-300 hover:text-violet-700 disabled:opacity-50"
              >
                <Upload size={17} />
                Upload Audio
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {isRecording && (
              <p className="mt-4 animate-pulse text-sm font-semibold text-red-600">
                ● Recording in progress...
              </p>
            )}

            {audioFile && (
              <div className="mt-5 rounded-xl border border-violet-100 bg-white p-4">
                <p className="mb-3 break-all text-sm text-slate-600">
                  Selected: {audioFile.name}
                </p>

                <button
                  type="button"
                  onClick={transcribeAudio}
                  disabled={isTranscribing}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {isTranscribing ? (
                    <Loader2 className="animate-spin" size={17} />
                  ) : (
                    <Mic size={17} />
                  )}

                  {isTranscribing
                    ? "Transcribing..."
                    : "Convert Speech to Text"}
                </button>
              </div>
            )}
          </div>

          <div className="mt-7">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Or type your complaint
            </label>

            <textarea
              value={transcript}
              onChange={(e) => {
                setTranscript(e.target.value);
                setError("");
                clearResult();
              }}
              placeholder="Describe your issue here... You can write in Hindi, English, Punjabi or Hinglish."
              rows={6}
              maxLength={5000}
              className="w-full resize-y rounded-xl border border-slate-200 bg-white p-4 text-sm leading-6 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
            />

            <p className="mt-2 text-right text-xs text-slate-400">
              {transcript.length}/5000 characters
            </p>
          </div>

          {error && (
            <div className="mt-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={
              isSubmitting ||
              isRecording ||
              isTranscribing ||
              !transcript.trim()
            }
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-700 px-6 py-4 text-sm font-bold text-white shadow-sm transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Understanding your complaint...
              </>
            ) : (
              <>
                Submit Complaint
                <Send size={17} />
              </>
            )}
          </button>
        </form>

        {result && (
          <section className="mt-7 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-start gap-3">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${currentStyle.container}`}
              >
                <ResultIcon size={24} />
              </div>

              <div>
                <h3 className="text-xl font-bold">
                  {resultHeading.title}
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  {resultHeading.description}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-slate-50 p-5">
              <div className="flex items-center gap-2 text-slate-500">
                <Ticket size={16} />
                <p className="text-xs font-semibold uppercase tracking-wider">
                  Your ticket reference
                </p>
              </div>

              <p className="mt-2 break-all text-xl font-extrabold text-violet-700">
                {result.ticketId || "Submitted"}
              </p>

              <p className="mt-2 text-xs text-slate-500">
                Save this reference to follow up on your complaint.
              </p>
            </div>

            {analysis?.clarificationNeeded && (
              <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-5">
                <div className="flex items-center gap-2 font-semibold text-blue-800">
                  <MessageCircle size={18} />
                  Additional information required
                </div>

                <p className="mt-3 text-sm leading-7 text-blue-900">
                  {analysis.clarificationMessage ||
                    "Our support team needs some additional information to proceed with your request."}
                </p>
              </div>
            )}

            {analysis?.escalationNeeded && (
              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <div className="flex items-center gap-2 font-semibold text-amber-800">
                  <AlertTriangle size={18} />
                  Human support escalation
                </div>

                <p className="mt-3 text-sm leading-7 text-amber-900">
                  {analysis.escalationReason ||
                    "Your complaint has been forwarded for human assistance."}
                </p>
              </div>
            )}

            <div className="mt-5">
              <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <MessageCircle size={17} />
                VaaniOS AI response
              </p>

              <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm leading-7 text-slate-700">
                {result.response || "Your complaint has been received."}
              </p>
            </div>

            {analysis && (
              <div className="mt-5">
                <h4 className="mb-3 text-sm font-bold text-slate-800">
                  Complaint analysis
                </h4>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">Category</p>
                    <p className="mt-1 font-semibold text-slate-800">
                      {analysis.category || "Not available"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">Priority</p>
                    <p className="mt-1 font-semibold text-slate-800">
                      {analysis.priority || "Not available"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">Detected language</p>
                    <p className="mt-1 font-semibold text-slate-800">
                      {analysis.language || "Not available"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">Order ID</p>
                    <p className="mt-1 break-all font-semibold text-slate-800">
                      {analysis.orderId || "Not provided"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">Transaction ID</p>
                    <p className="mt-1 break-all font-semibold text-slate-800">
                      {analysis.transactionId || "Not provided"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">Payment method</p>
                    <p className="mt-1 font-semibold text-slate-800">
                      {analysis.paymentMethod || "Not provided"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4 sm:col-span-2">
                    <p className="text-xs text-slate-500">Requested action</p>
                    <p className="mt-1 font-semibold text-slate-800">
                      {analysis.requestedAction || "Not specified"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4 sm:col-span-2">
                    <p className="text-xs text-slate-500">Complaint summary</p>
                    <p className="mt-1 text-sm leading-6 text-slate-800">
                      {analysis.summary || "Not available"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 rounded-2xl border border-violet-100 bg-violet-50/60 p-5">
              <h4 className="flex items-center gap-2 font-semibold text-slate-800">
                <Volume2 size={18} className="text-violet-700" />
                Listen to VaaniOS
              </h4>

              <p className="mt-1 text-xs text-slate-500">
                Hear the AI response in your selected language.
              </p>

              <button
                type="button"
                onClick={playResponse}
                disabled={isSpeaking}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-violet-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-800 disabled:opacity-50"
              >
                {isSpeaking ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <Volume2 size={17} />
                )}

                {isSpeaking
                  ? "Playing response..."
                  : "Listen to AI Response"}
              </button>

              {audioUrl && (
                <audio
                  controls
                  src={audioUrl}
                  className="mt-4 w-full"
                />
              )}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Link
                to="/customer/tickets"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-800"
              >
                <Ticket size={17} />
                View My Tickets
                <ArrowRight size={16} />
              </Link>

              <Link
                to="/customer/dashboard"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Back to Dashboard
              </Link>
            </div>

            <button
              type="button"
              onClick={resetForm}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              <RotateCcw size={16} />
              Submit another complaint
            </button>
          </section>
        )}

        <div className="mt-8 grid gap-4 text-center sm:grid-cols-3">
          <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
            <ShieldCheck size={17} className="text-emerald-600" />
            Secure complaint handling
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
            <Globe size={17} className="text-violet-700" />
            Multilingual assistance
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
            <Headphones size={17} className="text-violet-700" />
            AI-powered support
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-slate-400">
          Powered by VaaniOS Voice Intelligence
        </p>
      </main>
    </div>
  );
}

export default CustomerPortal;

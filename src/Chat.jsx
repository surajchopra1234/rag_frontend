// Import necessary libraries
import React, { useState, useEffect, useRef } from "react";
import { Mic, SendHorizontal } from "lucide-react";
import ReactMarkdown from "react-markdown";

const Chat = () => {
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState("");

    const [isIndexing, setIsIndexing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);

    const messagesEndRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    // Auto-scrolling to the bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Handle the indexing of documents
    const handleIndexing = async () => {
        setIsIndexing(true);

        try {
            const response = await fetch("http://127.0.0.1:8000/api/index/documents", {
                method: "POST"
            });
            if (!response.ok)
                throw new Error(`Indexing request failed with status ${response.status}`);

            alert("Documents indexed successfully!");
        } catch (error) {
            alert(`Failed to index documents: ${error.message}`);
        } finally {
            setIsIndexing(false);
        }
    };

    // Handle sending text messages
    const sendText = async (event) => {
        event.preventDefault();
        if (isLoading || !inputMessage.trim()) return;

        setMessages((previousMessages) => [
            ...previousMessages,
            { sender: "user", type: "text", text: inputMessage },
            { sender: "bot", type: "text", text: "" }
        ]);

        const query = inputMessage;
        setInputMessage("");

        setIsLoading(true);
        try {
            const response = await fetch("http://127.0.0.1:8000/api/queries/text", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query })
            });

            if (!response.ok) throw new Error(`API request failed with status ${response.status}`);

            const decoder = new TextDecoder();
            const reader = response.body.getReader();

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });

                setMessages((messages) => {
                    const lastMessage = messages[messages.length - 1];
                    const text = lastMessage.text + chunk;
                    return [...messages.slice(0, -1), { ...lastMessage, text }];
                });
            }
        } catch {
            setMessages((messages) => {
                const lastMessage = messages[messages.length - 1];
                const text =
                    "Sorry, I encountered an error processing the audio. Please try again.";
                return [...messages.slice(0, -1), { ...lastMessage, text }];
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Handle sending audio messages
    const sendAudio = async (audioBlob) => {
        // Audio messages are sent in wav format
        const formData = new FormData();
        formData.append("audio_file", audioBlob, "recording.wav");

        setIsLoading(true);
        try {
            const response = await fetch("http://127.0.0.1:8000/api/queries/audio", {
                method: "POST",
                body: formData
            });

            if (!response.ok) throw new Error(`API request failed with status ${response.status}`);

            const decoder = new TextDecoder();
            const reader = response.body.getReader();

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                setMessages((messages) => {
                    const lastMessage = messages[messages.length - 1];
                    const text = lastMessage.text + chunk;
                    return [...messages.slice(0, -1), { ...lastMessage, text }];
                });
            }
        } catch {
            setMessages((messages) => {
                const lastMessage = messages[messages.length - 1];
                const text =
                    "Sorry, I encountered an error processing the audio. Please try again.";
                return [...messages.slice(0, -1), { ...lastMessage, text }];
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Handle the start of audio recording
    const handleStartRecording = async () => {
        if (isRecording) return;

        try {
            // Request microphone access
            const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(mediaStream);

            mediaRecorderRef.current = recorder;
            audioChunksRef.current = [];

            // Capture audio data
            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) audioChunksRef.current.push(event.data);
            };

            // Handle the stop of recording
            recorder.onstop = () => {
                // Combine all audio chunks into a single Blob
                const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
                const audioUrl = URL.createObjectURL(audioBlob);

                const userMessage = { sender: "user", type: "audio", audioUrl };
                const botMessage = { sender: "bot", type: "text", text: "" };
                setMessages((prev) => [...prev, userMessage, botMessage]);

                sendAudio(audioBlob);

                // Stop all tracks on the stream to release the microphone
                mediaStream.getTracks().forEach((track) => track.stop());
            };

            recorder.start();
            setIsRecording(true);
        } catch (error) {
            console.error("Error accessing microphone:", error);
            alert("Could not access the microphone. Please check your browser permissions.");
        }
    };

    // Handle the stop of audio recording
    const handleStopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    return (
        <div className="flex h-screen items-center justify-center bg-gray-100 sm:py-8">
            <div className="flex h-full w-full max-w-2xl flex-col overflow-hidden bg-white sm:rounded-2xl sm:shadow-sm">
                {/* Header */}
                <header className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                    <h1 className="text-base font-semibold text-gray-950">RAG Chatbot</h1>

                    <button
                        onClick={handleIndexing}
                        disabled={isIndexing}
                        className="rounded-lg bg-gray-200/60 px-3.5 py-2 text-sm font-semibold text-gray-950 transition-colors hover:bg-gray-200 disabled:opacity-50">
                        {isIndexing ? "Indexing..." : "Index Documents"}
                    </button>
                </header>

                {/* Chat messages */}
                <main className="flex-1 space-y-4 overflow-y-auto p-6">
                    <div className="pb-2 text-center text-sm font-normal text-gray-500">Today</div>

                    {messages.map((message, index) => (
                        <div
                            key={index}
                            className={`flex items-end ${message.sender === "bot" ? "justify-start" : "justify-end"}`}>
                            <div
                                className={`max-w-md rounded-2xl px-4 py-3 ${
                                    message.sender === "bot"
                                        ? "rounded-bl-none bg-gray-100 shadow-xs"
                                        : message.type === "audio"
                                          ? "rounded-bl-none"
                                          : "rounded-br-none border border-gray-200 shadow-xs"
                                }`}>
                                {message.sender === "bot" && message.text === "" ? (
                                    // Render loading dots for bot's pending response
                                    <div className="flex items-center justify-center space-x-1">
                                        <span className="size-1.5 animate-bounce rounded-full bg-gray-500 [animation-delay:-0.3s]"></span>
                                        <span className="size-1.5 animate-bounce rounded-full bg-gray-500 [animation-delay:-0.15s]"></span>
                                        <span className="size-1.5 animate-bounce rounded-full bg-gray-500"></span>
                                    </div>
                                ) : message.type === "audio" ? (
                                    // Render the audio player for user's audio messages
                                    <audio src={message.audioUrl} controls className="w-64" />
                                ) : (
                                    <div className="prose-sm">
                                        <ReactMarkdown>{message.text}</ReactMarkdown>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* This div is the target for auto-scrolling */}
                    <div ref={messagesEndRef} />
                </main>

                {/* Bottom input */}
                <div className="border-t border-gray-200 px-5 py-4">
                    <form onSubmit={sendText} className="flex items-center gap-2">
                        <button
                            type="button"
                            onMouseDown={handleStartRecording}
                            onMouseUp={handleStopRecording}
                            onTouchStart={handleStartRecording}
                            onTouchEnd={handleStopRecording}
                            disabled={isLoading}
                            className={`rounded-full p-3 transition-colors disabled:opacity-50 ${
                                isRecording
                                    ? "animate-pulse bg-red-500 text-white"
                                    : "bg-gray-100 text-gray-600"
                            }`}>
                            <Mic size={20} />
                        </button>

                        <input
                            type="text"
                            value={inputMessage}
                            onChange={(event) => setInputMessage(event.target.value)}
                            placeholder="Message"
                            className="flex-1 rounded-full bg-gray-100 px-4 py-3 text-sm font-normal text-gray-900 placeholder-gray-500 focus:ring focus:ring-gray-300 focus:outline-none"
                            disabled={isLoading}
                        />

                        <button
                            type="submit"
                            className="rounded-full p-3 text-gray-600 transition-colors enabled:bg-gray-100 enabled:text-gray-800 disabled:opacity-50"
                            disabled={isLoading || !inputMessage.trim()}>
                            <SendHorizontal size={20} />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Chat;

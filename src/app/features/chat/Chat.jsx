// Import necessary libraries
import React, { useState, useEffect, useRef } from "react";
import { Mic, Pause, Play, SendHorizontal } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Link } from "react-router";

const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    else return (bytes / 1048576).toFixed(1) + " MB";
};

const Chat = () => {
    const [documents, setDocuments] = useState([]);
    const [nextMessageId, setNextMessageId] = useState(1);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState("");

    const [isLoading, setIsLoading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);

    const messagesEndRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    // Fetch the documents
    useEffect(() => {
        fetchDocuments().then();
    }, []);

    // Auto-scrolling to the bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Function to fetch documents from the API
    const fetchDocuments = async () => {
        setIsLoading(true);

        try {
            const response = await fetch("http://127.0.0.1:8000/api/documents", {
                method: "GET",
                headers: { "Content-Type": "application/json" }
            });

            if (!response.ok) throw new Error(`Failed to fetch documents: ${response.statusText}`);

            const data = await response.json();
            const formattedDocuments = data.documents.map((doc) => ({
                name: doc.file_name,
                type: doc.file_extension.substring(1),
                size: formatFileSize(doc.size),
                dateUploaded: new Date(doc.date).toISOString().split("T")[0],
                crawled_urls: doc?.crawled_urls ?? null
            }));

            setDocuments(formattedDocuments);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle sending text messages
    const sendText = async (event) => {
        event.preventDefault();
        if (isLoading || !inputMessage.trim()) return;

        const userMessage = { id: nextMessageId, sender: "user", type: "text", text: inputMessage };
        const botMessage = { id: nextMessageId + 1, sender: "bot", type: "text", text: "" };
        setNextMessageId((prev) => prev + 2);
        setMessages((previousMessages) => [...previousMessages, userMessage, botMessage]);

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

                setMessages((messages) =>
                    messages.map((message) => {
                        return message.id === botMessage.id
                            ? { ...message, text: message.text + chunk }
                            : message;
                    })
                );
            }
        } catch {
            setMessages((messages) =>
                messages.map((message) => {
                    return message.id === botMessage.id
                        ? { ...message, text: "Sorry, I encountered an error. Please try again." }
                        : message;
                })
            );
        } finally {
            setIsLoading(false);
        }
    };

    // Handle sending audio messages
    const sendAudio = async (audioBlob, audioUrl) => {
        if (isLoading) return;

        const userMessage = { id: nextMessageId, sender: "user", type: "audio", audioUrl };
        const botMessage = {
            id: nextMessageId + 1,
            sender: "bot",
            type: "text",
            text: "",
            audioInstance: null,
            audioState: "loading"
        };
        setNextMessageId((prev) => prev + 2);
        setMessages((prev) => [...prev, userMessage, botMessage]);

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

            let responseText = "";

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                responseText += chunk;

                setMessages((messages) =>
                    messages.map((message) => {
                        return message.id === botMessage.id
                            ? { ...message, text: message.text + chunk }
                            : message;
                    })
                );
            }

            // Send the full text to the text-to-speech endpoint
            const ttsResponse = await fetch("http://127.0.0.1:8000/api/text-to-speech", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query: responseText })
            });

            if (!ttsResponse.ok)
                throw new Error(`TTS API request failed with status ${ttsResponse.status}`);

            // Convert response to audio and play it
            const receivedAudioBlob = await ttsResponse.blob();
            const receivedAudioUrl = URL.createObjectURL(receivedAudioBlob);

            const audio = new Audio(receivedAudioUrl);
            audio.play();

            audio.onended = () => {
                setMessages((messages) =>
                    messages.map((message) => {
                        return message.id === botMessage.id
                            ? { ...message, audioState: "paused" }
                            : message;
                    })
                );
            };

            setMessages((messages) =>
                messages.map((message) => {
                    return message.id === botMessage.id
                        ? { ...message, audioInstance: audio, audioState: "playing" }
                        : message;
                })
            );
        } catch {
            setMessages((messages) =>
                messages.map((message) => {
                    return message.id === botMessage.id
                        ? { ...message, text: "Sorry, I encountered an error. Please try again." }
                        : message;
                })
            );
        } finally {
            setIsLoading(false);
        }
    };

    // Updated function to handle audio playback within message objects
    const handleAudioPlayback = (index, action) => {
        setMessages((messages) => {
            return messages.map((message, i) => {
                if (index === i) {
                    if (action === "play") {
                        message.audioInstance.play();
                        return { ...message, audioState: "playing" };
                    } else if (action === "pause") {
                        message.audioInstance.pause();
                        return { ...message, audioState: "paused" };
                    }
                }

                return message;
            });
        });
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

                sendAudio(audioBlob, audioUrl);

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
                <header>
                    {/* Header with title and link to sources */}
                    <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3.5">
                        <h1 className="text-base font-semibold text-gray-950">RAG Chatbot</h1>

                        <Link
                            to={"/sources"}
                            className="rounded-lg bg-gray-100 px-3.5 py-2.5 text-sm leading-none font-medium text-gray-900">
                            Sources
                        </Link>
                    </div>

                    {/* Document chips */}
                    {documents.length > 0 && (
                        <div className="flex flex-wrap gap-2.5 border-b border-gray-200 bg-gray-50 px-4 py-3.5">
                            {documents.map((doc, index) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-normal text-gray-800 shadow-xs">
                                    <span>{"📁"}</span>

                                    <span className="max-w-[100px] truncate">
                                        {doc.crawled_urls === null
                                            ? doc.name
                                            : doc.name.split("_").join(".")}
                                    </span>

                                    <span className="text-gray-400">{doc.size}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </header>

                {/* Chat messages */}
                <main className="flex-1 space-y-4 overflow-y-auto p-5">
                    <div className="text-center text-[13px] font-normal text-gray-500">Today</div>

                    {messages.map((message, index) => (
                        <div
                            key={index}
                            className={`flex items-end ${message.sender === "bot" ? "justify-start" : "justify-end"}`}>
                            <div
                                className={`relative max-w-md rounded-2xl px-4 py-3 ${
                                    message.sender === "bot"
                                        ? "rounded-bl-none bg-gray-100"
                                        : message.type === "audio"
                                          ? "rounded-bl-none"
                                          : "rounded-br-none border border-gray-200"
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
                                    <div>
                                        {message.sender === "bot" &&
                                            message.audioState &&
                                            (message.audioState === "loading" ? (
                                                <div className="absolute top-0 -right-10 rounded-full bg-gray-100 p-2">
                                                    <div className="size-4 animate-spin rounded-full border-[3px] border-gray-300 border-t-gray-700"></div>
                                                </div>
                                            ) : message.audioState === "playing" ? (
                                                <div className="absolute top-0 -right-10 rounded-full bg-gray-100 hover:bg-gray-200">
                                                    <button
                                                        onClick={() =>
                                                            handleAudioPlayback(index, "pause")
                                                        }
                                                        className="p-2 text-gray-900">
                                                        <svg
                                                            width="16"
                                                            height="16"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            xmlns="http://www.w3.org/2000/svg">
                                                            <path
                                                                d="M17.7931 20.3H15.3793C14.7156 20.3 14.1724 19.76 14.1724 19.1V4.69998C14.1724 4.04 14.7156 3.5 15.3793 3.5H17.7931C18.4568 3.5 19 4.04 19 4.69998V19.1C19 19.76 18.4568 20.3 17.7931 20.3Z"
                                                                fill="currentColor"
                                                            />
                                                            <path
                                                                d="M8.62067 20.3H6.20693C5.54316 20.3 5 19.76 5 19.1V4.69998C5 4.04 5.54316 3.5 6.20693 3.5H8.62067C9.28444 3.5 9.8276 4.04 9.8276 4.69998V19.1C9.8276 19.76 9.28444 20.3 8.62067 20.3Z"
                                                                fill="currentColor"
                                                            />
                                                        </svg>
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="absolute top-0 -right-10 rounded-full bg-gray-100 hover:bg-gray-200">
                                                    <button
                                                        onClick={() =>
                                                            handleAudioPlayback(index, "play")
                                                        }
                                                        className="p-2 text-gray-900">
                                                        <svg
                                                            width="16"
                                                            height="16"
                                                            viewBox="0 0 25 25"
                                                            fill="none"
                                                            xmlns="http://www.w3.org/2000/svg">
                                                            <path
                                                                d="M19.575 11.4621L6.90002 3.68711C6.07502 3.17459 5 3.77465 5 4.76213V20.2995C5 21.2745 6.07502 21.8745 6.90002 21.362L19.5625 13.5996C20.3625 13.0996 20.3625 11.9496 19.575 11.4621Z"
                                                                fill="currentColor"
                                                            />
                                                        </svg>
                                                    </button>
                                                </div>
                                            ))}

                                        <div className="prose-sm">
                                            <ReactMarkdown>{message.text}</ReactMarkdown>
                                        </div>
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
                            className="flex-1 rounded-full bg-gray-100 px-4 py-3 !text-sm font-normal text-gray-900 placeholder-gray-500 focus:ring focus:ring-gray-300 focus:outline-none"
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

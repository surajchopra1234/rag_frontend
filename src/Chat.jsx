// Import necessary dependencies
import React, { useState, useEffect, useRef } from "react";
import { SendHorizontal } from "lucide-react";
import ReactMarkdown from "react-markdown";

const Chat = () => {
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isIndexing, setIsIndexing] = useState(false);

    const messagesEndRef = useRef(null);

    // Auto-scrolling to the bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Handle documents indexing
    const handleIndexing = async () => {
        setIsIndexing(true);

        try {
            const response = await fetch("http://127.0.0.1:8000/api/index/", { method: "POST" });
            if (!response.ok)
                throw new Error(`Indexing request failed with status ${response.status}`);

            alert("Documents indexed successfully!");
        } catch (error) {
            alert(`Failed to index documents: ${error.message}`);
        } finally {
            setIsIndexing(false);
        }
    };

    // Handle sending a message
    const sendMessage = async (event) => {
        event.preventDefault();
        if (isLoading || !inputMessage.trim()) return;

        setMessages((previousMessages) => [
            ...previousMessages,
            { sender: "user", text: inputMessage },
            { sender: "bot", text: "" }
        ]);

        const query = inputMessage;
        setInputMessage("");

        setIsLoading(true);

        try {
            const response = await fetch("http://127.0.0.1:8000/api/rag/", {
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

                // Update the last message with the new chunk
                setMessages((prevMessages) => {
                    const lastMessage = prevMessages[prevMessages.length - 1];
                    const updatedLastMessage = { ...lastMessage, text: lastMessage.text + chunk };

                    return [...prevMessages.slice(0, -1), updatedLastMessage];
                });
            }
        } catch (error) {
            console.error("Failed to fetch streaming response:", error);
            // Update the last message to show an error
            setMessages((prevMessages) => {
                const lastMessage = prevMessages[prevMessages.length - 1];
                const updatedLastMessage = {
                    ...lastMessage,
                    text: "Sorry, I encountered an error. Please try again."
                };
                return [...prevMessages.slice(0, -1), updatedLastMessage];
            });
        } finally {
            setIsLoading(false);
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
                                className={`max-w-md rounded-2xl px-4 py-3 shadow-xs ${
                                    message.sender === "bot"
                                        ? "rounded-bl-none bg-gray-100"
                                        : "rounded-br-none border border-gray-200"
                                }`}>
                                {message.sender === "bot" && message.text === "" ? (
                                    <div className="flex items-center justify-center space-x-1">
                                        <span className="size-1.5 animate-bounce rounded-full bg-gray-500 [animation-delay:-0.3s]"></span>
                                        <span className="size-1.5 animate-bounce rounded-full bg-gray-500 [animation-delay:-0.15s]"></span>
                                        <span className="size-1.5 animate-bounce rounded-full bg-gray-500"></span>
                                    </div>
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
                    <form onSubmit={sendMessage} className="flex items-center gap-2">
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

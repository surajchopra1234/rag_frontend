// Import modules
import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import { BrowserRouter, Routes, Route } from "react-router";
import App from "./app/App.jsx";
import Chat from "./app/features/chat/Chat.jsx";
import Data from "./app/features/data/Data.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
    <BrowserRouter>
        <StrictMode>
            <Routes>
                <Route path="/" element={<App />}>
                    <Route index element={<Chat />} />
                    <Route path="data" element={<Data />} />
                </Route>
            </Routes>
        </StrictMode>
    </BrowserRouter>
);

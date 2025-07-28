// Import modules
import { Outlet } from "react-router";
import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import "@mantine/dropzone/styles.css";

function App() {
    return (
        <MantineProvider>
            <main>
                <Outlet />
            </main>
        </MantineProvider>
    );
}

export default App;

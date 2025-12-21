import "./App.css";
import { ThemeProvider } from "./components";
import { Toaster } from "react-hot-toast";
import { Toaster as SonnerToaster } from "sonner";
import AppRouter from "./routes";

function App() {
  return (
    <ThemeProvider>
      <Toaster />
      <SonnerToaster position="top-right" richColors />
      <AppRouter />
    </ThemeProvider>
  );
}

export default App;

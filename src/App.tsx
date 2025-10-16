import "./App.css";
import { ThemeProvider } from "./components";
import { Toaster } from "react-hot-toast";
import AppRouter from "./routes";

function App() {
  return (
    <ThemeProvider>
      <AppRouter />
      <Toaster />
    </ThemeProvider>
  );
}

export default App;

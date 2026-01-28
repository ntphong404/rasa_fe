import "./App.css";
import { ThemeProvider } from "./components";
import { Toaster } from "react-hot-toast";
import { Toaster as SonnerToaster } from "sonner";
import AppRouter from "./routes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Toaster />
        <SonnerToaster position="top-right" richColors />
        <AppRouter />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

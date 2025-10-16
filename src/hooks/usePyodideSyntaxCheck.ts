import { useState, useEffect, useRef } from "react";

export function usePyodideSyntaxCheck(code: string, enabled: boolean = true) {
  const [pyodide, setPyodide] = useState<any>(null);
  const [isPyodideLoading, setIsPyodideLoading] = useState(true);
  const [syntaxError, setSyntaxError] = useState<string | null>(null);
  const syntaxCheckTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load Pyodide
  useEffect(() => {
    if (!enabled || pyodide) return;

    const loadPyodideInstance = async () => {
      setIsPyodideLoading(true);
      try {
        // @ts-ignore
        const py = await window.loadPyodide({
          indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/",
        });
        setPyodide(py);
        console.log("Pyodide loaded successfully");
      } catch (err) {
        console.error("Failed to load Pyodide:", err);
      } finally {
        setIsPyodideLoading(false);
      }
    };

    loadPyodideInstance();
  }, [enabled, pyodide]);

  // Check syntax function
  const checkPythonSyntax = async (codeToCheck: string): Promise<string | null> => {
    if (!pyodide || !codeToCheck.trim()) return null;

    try {
      pyodide.globals.set("code_to_check", codeToCheck);

      const script = `
import traceback
try:
    compile(code_to_check, "<string>", "exec")
    result = "OK"
except SyntaxError as e:
    result = f"SyntaxError: {e.msg} (line {e.lineno}, offset {e.offset})"
except Exception as ex:
    result = f"Error: {str(ex)}"
`;

      await pyodide.runPythonAsync(script);
      const result = pyodide.globals.get("result");

      if (result && result !== "OK") {
        return result;
      }
      return null;
    } catch (err) {
      console.error("Pyodide syntax check error:", err);
      return `Unexpected error: ${String(err)}`;
    }
  };

  // Real-time syntax check with debounce
  useEffect(() => {
    if (!code.trim() || !pyodide || isPyodideLoading || !enabled) {
      setSyntaxError(null);
      return;
    }

    if (syntaxCheckTimerRef.current) {
      clearTimeout(syntaxCheckTimerRef.current);
    }

    syntaxCheckTimerRef.current = setTimeout(async () => {
      const err = await checkPythonSyntax(code);
      setSyntaxError(err);
    }, 1000);

    return () => {
      if (syntaxCheckTimerRef.current) {
        clearTimeout(syntaxCheckTimerRef.current);
      }
    };
  }, [code, pyodide, isPyodideLoading, enabled]);

  return {
    syntaxError,
    setSyntaxError,
    isPyodideLoading,
    checkPythonSyntax,
  };
}
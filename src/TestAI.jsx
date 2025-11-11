import { useState } from "react";
import { callAI } from "@/lib/ai";

function TestAI() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  const handleGenerate = async () => {
    setLoading(true);
    setResult("");
    const res = await callAI("Scrivi una breve lettera di messa in mora in italiano, tono formale e legale.");
    setResult(res);
    setLoading(false);
  };

  return (
    <div style={{ padding: "2rem" }}>
      <button
        onClick={handleGenerate}
        style={{
          background: "#2563eb",
          color: "white",
          padding: "0.6rem 1rem",
          borderRadius: "8px",
          border: "none",
          cursor: "pointer",
        }}
      >
        {loading ? "🧠 Generazione in corso..." : "Genera lettera di prova"}
      </button>

      {result && (
        <pre
          style={{
            marginTop: "1.5rem",
            background: "#f3f4f6",
            padding: "1rem",
            borderRadius: "8px",
            whiteSpace: "pre-wrap",
          }}
        >
          {result}
        </pre>
      )}
    </div>
  );
}
export default TestAI;

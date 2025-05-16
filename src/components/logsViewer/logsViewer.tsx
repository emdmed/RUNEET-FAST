import { useScriptWebSocket } from "@/hooks/useScriptLogs";
import { useEffect } from "react";

export default function ScriptOutputViewer({
  isEditMode,
  isRunning,
  scriptId,
  output,
  setOutput,
  isTerminal,
}: {
  isEditMode: boolean;
  scriptId: string;
  output: string[];
  setOutput: any;
  isTerminal: boolean;
  isRunning: boolean | undefined;
}) {
  useEffect(() => {
    if (!isRunning) setOutput([]);
  }, [isRunning]);

  useScriptWebSocket(scriptId, (msg) => {
    console.log("msg", msg);
    if (msg.type === "stdout" || msg.type === "stderr") {
      setOutput((prev: any) => [...prev, `${msg.data}`]);
    } else if (msg.type === "exit") {
      setOutput((prev: any) => [
        ...prev,
        `Process exited with code ${msg.code}`,
      ]);
    }
  });

  if (!isTerminal) return null;
  if (isEditMode) return null;

  return (
    <div className="mt-2">
      <span className="text-sm">Terminal</span>
      <pre
        className="bg-stone-950 text-sm p-2 max-h-[250px] overflow-auto border rounded/"
        style={{ whiteSpace: "pre-wrap" }}
      >
        {output.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </pre>
    </div>
  );
}

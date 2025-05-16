import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Play, Server, Terminal, Trash, Monitor, Square } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import api from "@/utils/api";
import type { ScriptComponentProps, RunCommandResponse } from "@/types/types";
import ScriptOutputViewer from "@/components/logsViewer/logsViewer";

const getScriptIcon = (type: string) => {
  if (type === "frontend") {
    return <Monitor size={14} />;
  } else if (type === "backend") {
    return <Server size={14} />;
  }
  return null;
};

export const ScriptComponent = ({
  script,
  updateScript,
  isEditMode,
  removeScript,
  handleStopScript,
  socket,
  project,
  setProjects,
  projects,
}: ScriptComponentProps) => {
  const [isTerminal, setIsTerminal] = useState(false);
  const [output, setOutput] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState<boolean | undefined>(false);

  socket.onmessage = (event: any) => {
    console.log("script onmessage", event);
    if (event.type === "message") {
      const data = JSON.parse(event.data);
      if (data.scriptId === script.id) {
        setIsRunning(data.running);
      }
    }
  };

  const sendSingleScriptStart = async () => {
    const response: RunCommandResponse = await api.post(
      "/api/run-script",
      script
    );
    return response;
  };

  useEffect(() => {
    setIsRunning(script.isRunning);
  }, [script.isRunning]);

  const handleRunScript = async (project: any, scriptId: string) => {
    console.log(`Running script ${scriptId} for project ${project.id}`);
    // Here you would implement the actual script running logic

    const response: RunCommandResponse = await sendSingleScriptStart();
    console.log("response", response);
    if (response?.success) setIsRunning(true);

    // Update the isRunning status in the state
    if (setProjects) {
      setProjects(
        projects.map((p: any) => {
          if (p.id === project.id) {
            return {
              ...p,
              scripts: p.scripts.map((script: any) => {
                if (script.id === scriptId) {
                  return { ...script, isRunning: true };
                }
                return script;
              }),
            };
          }
          return p;
        })
      );
    }
  };

  return (
    <div key={script.id} className="flex flex-col w-full">
      <div className="flex items-center gap-1">
        {isEditMode ? (
          <div className="grid grid-cols-1 gap-2 py-2">
            <div className="flex items-center gap-2">
              <Input
                value={script.name}
                onChange={(e) =>
                  updateScript(script.id, "name", e.target.value)
                }
                placeholder="Script name"
                className="h-8"
              />
              <Select
                value={script.type}
                onValueChange={(value) =>
                  updateScript(script.id, "type", value)
                }
              >
                <SelectTrigger className="w-24 h-8">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="frontend">Frontend</SelectItem>
                  <SelectItem value="backend">Backend</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeScript(script.id)}
              >
                <Trash size={14} />
              </Button>
            </div>
            <Input
              value={script.absolutePath}
              onChange={(e) =>
                updateScript(script.id, "absolutePath", e.target.value)
              }
              placeholder="Path to script"
              className="h-8"
            />
            <Textarea
              value={script.script}
              onChange={(e) =>
                updateScript(script.id, "script", e.target.value)
              }
              placeholder="Script command"
              className="h-8"
            />
          </div>
        ) : (
          <div className="flex my-1 px-1 w-full justify-between">
            <div className="flex items-center gap-2">
              {getScriptIcon(script.type)}
              <span>{script.name}</span>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => setIsTerminal((prev) => !prev)}
                variant="outline"
                size="icon"
              >
                <Terminal />
              </Button>

              {isRunning ? (
                <Button
                  variant="default"
                  size="icon"
                  className="bg-0 text-rose-500 hover:bg-rose-500 hover:text-black"
                  onClick={() => handleStopScript(project, script.id)}
                >
                  <Square size={14} />
                </Button>
              ) : (
                <Button
                  variant="default"
                  size="icon"
                  className="bg-0 text-lime-300 hover:bg-lime-300 hover:text-black"
                  onClick={() => handleRunScript(project, script.id)}
                >
                  <Play size={14} />
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      <ScriptOutputViewer
      isEditMode={isEditMode}
        output={output}
        isTerminal={isTerminal}
        setOutput={setOutput}
        scriptId={script.id}
        isRunning={isRunning}
      />
    </div>
  );
};

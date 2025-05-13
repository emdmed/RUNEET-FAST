import { useState, useEffect } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Play,
  Server,
  Pencil,
  Check,
  X,
  Plus,
  Trash,
  Monitor,
  Square,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import type { Script, ProjectCardProps } from "@/types/types";

export const Project = ({
  projectName,
  scripts: initialScripts,
  onRunScript,
  onStopScript,
  onRunAllScripts,
  onUpdateScripts,
  onStopAllScripts,
  activeScriptsIds,
  onProjectDelete,
  project,
  sendSingleScriptStart,
}: ProjectCardProps) => {
  const [scripts, setScripts] = useState<Script[]>(initialScripts);
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Add useEffect to sync scripts when initialScripts change
  useEffect(() => {
    setScripts(initialScripts);
  }, [initialScripts]);

  const handleStopScript = async (scriptId: string) => {
    try {
      setIsLoading((prev) => ({ ...prev, [scriptId]: true }));
      await onStopScript(scriptId);
    } finally {
      setIsLoading((prev) => ({ ...prev, [scriptId]: false }));
    }
  };

  const handleRunAllScripts = async () => {
    if (!onRunAllScripts) return;
    try {
      await onRunAllScripts();
    } catch (e) {
      console.log(e);
    }
  };

  const handleStopALlScripts = async () => {
    if (!onStopAllScripts) return;
    try {
      await onStopAllScripts();
    } catch (e) {
      console.log(e);
    }
  };

  const toggleEditMode = () => {
    if (isEditMode) {
      setScripts(initialScripts); // Reset changes if canceling
    }
    setIsEditMode(!isEditMode);
  };

  const saveChanges = async () => {
    if (!onUpdateScripts) return;
    try {
      setIsSaving(true);
      // Ensure all scripts have IDs before saving
      const scriptsWithIds = scripts.map((script) => {
        if (!script.id) {
          return {
            ...script,
            id: `script-${Date.now()}-${Math.random()
              .toString(36)
              .substr(2, 9)}`,
          };
        }
        return script;
      });
      await onUpdateScripts(scriptsWithIds);
      setIsEditMode(false);
    } finally {
      setIsSaving(false);
    }
  };

  const updateScript = (id: string, field: keyof Script, value: any) => {
    console.log("id", id, "field", field, "value", value);
    setScripts((prevScripts) =>
      prevScripts.map((script) =>
        script.id === id ? { ...script, [field]: value } : script
      )
    );
  };

  const addNewScript = () => {
    const newId = `script-${Date.now()}`;
    setScripts((prev) => [
      ...prev,
      {
        id: newId,
        name: "New Script",
        script: "npm start",
        absolutePath: "/path/to/script",
        type: "other",
        isRunning: false,
      },
    ]);
  };

  const removeScript = (id: string) => {
    setScripts((prev) => prev.filter((script) => script.id !== id));
  };

  const getScriptIcon = (type: string) => {
    if (type === "frontend") {
      return <Monitor size={14} />;
    } else if (type === "backend") {
      return <Server size={14} />;
    }
    return null;
  };

  const areAllScriptsRunning = scripts.every((script) =>
    activeScriptsIds.includes(script.id)
  );

  const handleProjectDelete = (project: any) => {
    onProjectDelete(project);
  };

  return (
    <div className="p-2 border rounded bg-card min-w-[270px]">
      <div className="p-1 border-b text-lg font-bold">
        <div className="flex items-center justify-between">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-1">
              {projectName}
              <Button
                className="text-gray-600"
                variant="ghost"
                size="icon"
                onClick={toggleEditMode}
              >
                <Pencil size={14} />
              </Button>
              <Button
                className="text-gray-600"
                variant="ghost"
                size="icon"
                onClick={() => handleProjectDelete(project)}
              >
                <Trash size={14} />
              </Button>
            </div>
            <div className="flex gap-2">
              {!areAllScriptsRunning && (
                <Button
                  variant="default"
                  className="bg-lime-300"
                  size="sm"
                  onClick={handleRunAllScripts}
                  disabled={areAllScriptsRunning}
                >
                  <Play />
                </Button>
              )}
              {areAllScriptsRunning && (
                <Button
                  variant="default"
                  size="icon"
                  className="bg-0 text-rose-500 hover:bg-rose-500 hover:text-black"
                  onClick={handleStopALlScripts}
                  disabled={!areAllScriptsRunning}
                >
                  <Square />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="grid py-2">
          {scripts.map((script) => (
            <div key={script.id} className="flex items-center gap-1">
              {isEditMode ? (
                <div className="grid grid-cols-1 gap-2 w-full py-2">
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

                    {activeScriptsIds.includes(script.id) && script.port && (
                      <small className="text-xs">Port {script.port}</small>
                    )}
                    {activeScriptsIds.includes(script.id) ? (
                      <Button
                        variant="default"
                        size="sm"
                        className="bg-0 text-rose-500 hover:bg-rose-500 hover:text-black"
                        onClick={() => handleStopScript(script.id)}
                        disabled={isLoading[script.id]}
                      >
                        {isLoading[script.id] ? (
                          "Stopping..."
                        ) : (
                          <>
                            <Square size={14} />
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        variant="default"
                        size="sm"
                        className="bg-0 text-lime-300 hover:bg-lime-300 hover:text-black"
                        onClick={() => onRunScript(project, script.id)}
                        disabled={isLoading[script.id]}
                      >
                        {isLoading[script.id] ? (
                          "Starting..."
                        ) : (
                          <Play size={14} />
                        )}
                      </Button>
                    )}
               
                </div>
              )}
            </div>
          ))}

          {isEditMode && (
            <Button
              variant="secondary"
              size="sm"
              onClick={addNewScript}
              className="flex items-center my-2"
            >
              <Plus size={14} className="mr-1" />
              Add Script
            </Button>
          )}
        </div>
      </div>

      {isEditMode && (
        <div className="p-1 flex justify-between">
          <Button variant="outline" size="sm" onClick={toggleEditMode}>
            <X size={14} className="mr-1" />
            Cancel
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={saveChanges}
            disabled={isSaving}
          >
            {isSaving ? (
              "Saving..."
            ) : (
              <>
                <Check size={14} className="mr-1" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

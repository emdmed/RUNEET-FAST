import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Play,
  Pencil,
  Check,
  X,
  Plus,
  Trash,
  Square,
} from "lucide-react";
import type { Script, ProjectCardProps } from "@/types/types";
import { ScriptComponent } from "./script/script";

export const Project = ({
  projectName,
  scripts: initialScripts,
  onStopScript,
  onUpdateScripts,
  onProjectDelete,
  project,
  sendScriptStart,
  projects,
  setProjects,
  sendScriptsStop,
  socket
}: ProjectCardProps) => {
  const [scripts, setScripts] = useState<Script[]>(initialScripts);
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEntireProjectRunning, setIsEntireProjectRunning] = useState(false);

  const handleRunAllScripts = async () => {
    const scripts = project.scripts;

    const startedScripts = [];

    for (let i = 0; i < scripts.length; i++) {
      const response = await sendScriptStart(scripts[i]);
      startedScripts.push(response);
    }

    const areAllRunning = startedScripts.every((s) => s.success === true);

    if (areAllRunning) setIsEntireProjectRunning(true);

    if (setProjects) {
      setProjects(
        projects.map((p: any) => {
          if (p.id === project.id) {
            return {
              ...project,
              scripts: p.scripts.map((script: any) => ({
                ...script,
                isRunning: true,
              })),
            };
          }
          return project;
        })
      );
    }
  };

  const handleStopAllScripts = async () => {
    const scripts = project.scripts;

    const stoppedScripts = [];

    for (let i = 0; i < scripts.length; i++) {
      const response = await sendScriptsStop(scripts[i]);
      stoppedScripts.push(response);
    }

    const areAllRunning = stoppedScripts.every((s) => s.success === true);

    if (areAllRunning) setIsEntireProjectRunning(false);

    if (setProjects) {
      setProjects(
        projects.map((p: any) => {
          if (p.id === project.id) {
            return {
              ...project,
              scripts: p.scripts.map((script: any) => ({
                ...script,
                isRunning: true,
              })),
            };
          }
          return project;
        })
      );
    }
  };

  // Add useEffect to sync scripts when initialScripts change
  useEffect(() => {
    setScripts(initialScripts);
  }, [initialScripts]);

  const handleStopScript = async (project: any, scriptId: string) => {
    try {
      setIsLoading((prev) => ({ ...prev, [scriptId]: true }));
      await onStopScript(project, scriptId);
    } finally {
      setIsLoading((prev) => ({ ...prev, [scriptId]: false }));
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

/*   const areAllScriptsRunning = scripts.every((script) =>
    activeScriptsIds.includes(script.id)
  ); */

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
              {!isEntireProjectRunning && (
                <Button
                  variant="default"
                  className="bg-lime-300"
                  size="icon"
                  onClick={handleRunAllScripts}
                >
                  <Play />
                </Button>
              )}
              {isEntireProjectRunning && (
                <Button
                  variant="default"
                  size="icon"
                  className="bg-0 text-rose-500 hover:bg-rose-500 hover:text-black"
                  onClick={handleStopAllScripts}
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
            <ScriptComponent
              script={script}
              removeScript={removeScript}
              isEditMode={isEditMode}
              updateScript={updateScript}
              handleStopScript={handleStopScript}
              isLoading={isLoading}
              project={project}
              projects={projects}
              setProjects={setProjects}
              socket={socket}
            />
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

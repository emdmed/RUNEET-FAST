import { useState, useEffect } from "react";
import AddProject from "./components/addProject/addProject";
import { Projects } from "./components/projects/projects";
import { loadProjectsFromStorage, saveProjectsToStorage } from "./utils/utils";
import type { ProjectData } from "./types/types";
import { PortScanner } from "./components/portScanner/portScanner";
const socket = new WebSocket("ws://localhost:3002");

// Define interface for API response
/* interface ProjectResponse {
  id: string;
  name: string;
  scripts: ScriptResponse[];
}
 */
/* interface ScriptResponse {
  id: string;
  name: string;
  isRunning: boolean;
} */

function App() {
  const [projects, setProjects] = useState<ProjectData[]>([]);
 // const [activeScriptsIds, setActiveScriptsIds] = useState<string[]>([]);

  socket.onopen = () => {
    console.log("Connected to Node server");
  };

  socket.onclose = () => {
    console.log("WebSocket closed");
    const newProjects = projects.map((p) => ({
      ...p,
      scripts: p.scripts.map((s) => ({ ...s, isRunning: false })),
    }));
    console.log("newProjects", newProjects);
    setProjects(newProjects);
  };

  // Helper function to safely resolve response type
/*   function resolveResponse(response: unknown): ProjectResponse[] {
    if (
      response !== null &&
      typeof response === "object" &&
      "data" in response
    ) {
      return (response as { data: ProjectResponse[] }).data;
    }
    return response as ProjectResponse[];
  } */

/*   const sendMonitorProcesses = async (projects: ProjectData[]) => {
    if (projects.length === 0) return;

    // Using type assertion to fix the 'unknown' type
    const response = await api.post<ProjectResponse[]>(
      "/api/check-status",
      projects
    );

    // Use helper function to safely resolve the response type
    const projectsData = resolveResponse(response);

    const activeScripts = projectsData
      .map((project: ProjectResponse) => project.scripts)
      .flat()
      .filter((script: ScriptResponse) => script.isRunning);

    const activeScriptIds = activeScripts.map((s: ScriptResponse) => s.id);
    setActiveScriptsIds(activeScriptIds);
  }; */

  // Load projects from localStorage on initial render
  useEffect(() => {
    const savedProjects = loadProjectsFromStorage();
    if (savedProjects && savedProjects.length > 0) {
      setProjects(savedProjects);
    }
  }, []);

  // Save projects to localStorage whenever they change
  useEffect(() => {
    saveProjectsToStorage(projects);
  }, [projects]);

  // Fixed updateProjects function that handles both direct values and updater functions
  const updateProjects = (
    valueOrFunction: React.SetStateAction<ProjectData[]>
  ) => {
    setProjects(valueOrFunction);
  };

  return (
    <div className="h-screen p-2">
      <div className="flex p-1 items-center gap-2 border-b pb-2">
        <span className="font-bold text-xl">Runeet</span>{" "}
        <AddProject setProjects={updateProjects} projects={projects} />
      </div>
      <div className="flex p-2" style={{ minHeight: 38 }}>
        <PortScanner />
      </div>
      <div className="flex p-2 items-center w-full justify-center sm:justify-start">
        <Projects
          projects={projects}
          setProjects={updateProjects}
          socket={socket}
        />
      </div>
    </div>
  );
}

export default App;

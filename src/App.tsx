import { useState, useEffect } from "react";
import AddProject from "./components/addProject/addProject";
import { Projects } from "./components/projects/projects";
import { loadProjectsFromStorage, saveProjectsToStorage } from "./utils/utils";
import api from "./utils/api";

function App() {
  const [projects, setProjects] = useState([]);
  const [activeScriptsIds, setActiveScriptsIds] = useState([])

  const sendMonitorProcesses = async (projects) => {
    if(projects.length === 0) return
    const response = await api.post("/api/check-status", projects);
    const activeScripts = response.map(project => project.scripts).flat().filter(script => script.isRunning)
    const activeScriptIds = activeScripts.map(s => s.id)
    setActiveScriptsIds(activeScriptIds)
  };

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

  useEffect(() => {
    const timer = setInterval(() => {
      sendMonitorProcesses(projects);
    }, 1000);

    return () => clearInterval(timer);
  }, [projects]);

  // Custom project updater that ensures we're working with fresh state
  const updateProjects = (newProjects) => {
    setProjects(newProjects);
  };

  return (
    <div className="h-screen p-8">
      <div className="flex p-2 items-center gap-3">
        <span className="font-bold text-xl">Runeet</span>{" "}
        <AddProject setProjects={updateProjects} projects={projects} />
      </div>
      <div className="flex p-2 items-center">
        <Projects activeScriptsIds={activeScriptsIds} projects={projects} setProjects={updateProjects} />
      </div>
    </div>
  );
}

export default App;

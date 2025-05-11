import React from "react";
import { Project } from "./project/project"; // Adjust path as needed
import api from "@/utils/api";

interface Script {
  id: string;
  name: string;
  script: string;
  absolutePath: string;
  port?: number;
  isRunning?: boolean;
  type: "frontend" | "backend" | "other";
}

interface ProjectData {
  id: string;
  projectName: string;
  scripts: Script[];
  scriptCount: number;
}

interface ProjectsProps {
  projects: ProjectData[];
  setProjects?: (projects: ProjectData[]) => void;
  activeScriptsIds: string[]
}

export const Projects = ({ projects, setProjects , activeScriptsIds}: ProjectsProps) => {
  const handleRunScript = async (projectId: string, scriptId: string) => {
    console.log(`Running script ${scriptId} for project ${projectId}`);
    // Here you would implement the actual script running logic

    // Update the isRunning status in the state
    if (setProjects) {
      setProjects(
        projects.map((project) => {
          if (project.id === projectId) {
            return {
              ...project,
              scripts: project.scripts.map((script) => {
                if (script.id === scriptId) {
                  return { ...script, isRunning: true };
                }
                return script;
              }),
            };
          }
          return project;
        })
      );
    }
  };

  const handleStopScript = async (projectId: string, scriptId: string) => {
    console.log(`Stopping script ${scriptId} for project ${projectId}`);
    // Here you would implement the actual script stopping logic

    // Update the isRunning status in the state
    if (setProjects) {
      setProjects(
        projects.map((project) => {
          if (project.id === projectId) {
            return {
              ...project,
              scripts: project.scripts.map((script) => {
                if (script.id === scriptId) {
                  return { ...script, isRunning: false };
                }
                return script;
              }),
            };
          }
          return project;
        })
      );
    }
  };

  const sendScriptStart = async (project) => {
    console.log("project2 ", project);
    const response = await api.post("/api/run-command", project);
    console.log("response", response);
  };

  const sendScriptStop = async (project) => {
    const response = await api.post("/api/stop-scripts", project);
    console.log("response", response);
  };

  const handleRunAllScripts = async (projectId: string) => {
    console.log(`Running all scripts for project ${projectId}`);
    // Here you would implement logic to run all scripts
    console.log("project");
    const project = projects.find((p) => p.id === projectId);

    console.log("project 1", project);
    sendScriptStart(project);

    // Update all scripts to running in the state
    if (setProjects) {
      setProjects(
        projects.map((project) => {
          if (project.id === projectId) {
            return {
              ...project,
              scripts: project.scripts.map((script) => ({
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

  const handleStopAllScripts = async (projectId: string) => {
    console.log(`Running all scripts for project ${projectId}`);
    // Here you would implement logic to run all scripts
    const project = projects.find((p) => p.id === projectId);

    sendScriptStop(project);

    // Update all scripts to running in the state
    if (setProjects) {
      setProjects(
        projects.map((project) => {
          if (project.id === projectId) {
            return {
              ...project,
              scripts: project.scripts.map((script) => ({
                ...script,
                isRunning: false,
              })),
            };
          }
          return project;
        })
      );
    }
  };

  const handleUpdateScripts = async (
    projectId: string,
    updatedScripts: Script[]
  ) => {
    console.log(`Updating scripts for project ${projectId}`, updatedScripts);

    // Update the scripts for the specific project
    if (setProjects) {
      setProjects(
        projects.map((project) => {
          if (project.id === projectId) {
            return {
              ...project,
              scripts: updatedScripts,
            };
          }
          return project;
        })
      );
    }
  };

  const handleEditProject = (projectId: string) => {
    console.log(`Edit project ${projectId}`);
    // Implement project editing functionality if needed
  };

  return (
    <div className="">
      {projects.length === 0 ? (
        <div className="col-span-full text-center p-4">
          No projects yet. Create your first project using the button above.
        </div>
      ) : (
        projects.map((project) => (
          <Project
          activeScriptsIds={activeScriptsIds}
            key={project.id}
            projectName={project.projectName}
            scripts={project.scripts}
            onRunScript={(scriptId) => handleRunScript(project.id, scriptId)}
            onStopScript={(scriptId) => handleStopScript(project.id, scriptId)}
            onRunAllScripts={() => handleRunAllScripts(project.id)}
            onStopAllScripts={() => handleStopAllScripts(project.id)}
            onUpdateScripts={(updatedScripts) =>
              handleUpdateScripts(project.id, updatedScripts)
            }
            onEditProject={() => handleEditProject(project.id)}
          />
        ))
      )}
    </div>
  );
};

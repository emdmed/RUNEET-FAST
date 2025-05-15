import { Project } from "./project/project"; // Adjust path as needed
import api from "@/utils/api";
import type { Script, ProjectsProps } from "@/types/types";

export const Projects = ({
  projects,
  setProjects,
  socket
}: ProjectsProps) => {

/*   const handleRunScript = async (project: any, scriptId: string) => {
    console.log(`Running script ${scriptId} for project ${project.id}`);
    // Here you would implement the actual script running logic

    await sendSingleScriptStart(project, scriptId);

    // Update the isRunning status in the state
    if (setProjects) {
      setProjects(
        projects.map((project) => {
          if (project.id === project.id) {
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
  }; */

  const onProjectDelete = (project: any) => {
    if (!setProjects) return;
    setProjects(projects.filter((p) => p.id !== project.id));
  };

  const handleStopScript = async (p: any, scriptId: string) => {
    // Here you would implement the actual script stopping logic
    console.log("p", p, "scriptId", scriptId);
    sendScriptStop(p, scriptId);
    // Update the isRunning status in the state
    if (setProjects) {
      setProjects(
        projects.map((project) => {
          if (project.id === p.id) {
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

  const sendScriptStart = async (project: any) => {
    const response = await api.post("api/run-script", project);
    return response
  };

/*   const sendSingleScriptStart = async (project: any, scriptId: string) => {
        const response = await api.post("/api/run-commands", {
      ...project,
      scripts: project.scripts.filter((s: any) => s.id === scriptId),
    }); 
    console.log("response", response);
  }; */

  const sendScriptsStop = async (script: any) => {
     const response = await api.post("api/stop-script", script);
     return response
  };

  const sendScriptStop = async (project: any, scriptId: string) => {
    const singleScriptProject = {
      ...project,
      scripts: project.scripts.filter((s: any) => s.id === scriptId),
    };
    const response = await api.post("/api/stop-scripts", singleScriptProject);
    console.log("response", response);
  };


  const handleStopAllScripts = async (projectId: string) => {
    const project: any = projects.find((p) => p.id === projectId);

    const scripts = project.scripts;

    for (let i = 0; i < scripts.length; i++) {
      await sendScriptsStop(scripts[i]);
    }

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
  };

  return (
    <div className="grid grid-cols-1 xs:justify-center sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {projects.length === 0 ? (
        <div className="flex w-full justify-center p-4">
          No projects yet. Create your first project using the button above.
        </div>
      ) : (
        projects.map((project) => (
          <Project
            key={project.id}
            project={project}
            onProjectDelete={onProjectDelete}
            projectName={project.projectName}
            scripts={project.scripts}
            onStopScript={(project, scriptId) =>
              handleStopScript(project, scriptId)
            }
            sendScriptStart={sendScriptStart}
            onStopAllScripts={() => handleStopAllScripts(project.id)}
            onUpdateScripts={(updatedScripts) =>
              handleUpdateScripts(project.id, updatedScripts)
            }
            onEditProject={() => handleEditProject(project.id)}
            projects={projects}
            setProjects={setProjects}
            sendScriptsStop={sendScriptsStop}
            socket={socket}
          />
        ))
      )}
    </div>
  );
};

export interface Script {
  id: string;
  name: string;
  script: string;
  absolutePath: string;
  port?: number;
  isRunning?: boolean;
  type: "frontend" | "backend" | "other";
}

export interface ProjectData {
  id: string;
  projectName: string;
  scripts: Script[];
  scriptCount: number;
}

export interface ProjectsProps {
  projects: ProjectData[];
  setProjects?: (projects: ProjectData[]) => void;
  socket: any;
}

export interface RunCommandResponse {
  message: string;
  projectName: string;
  projectId: string;
  results: any;
  success: boolean;
}

export interface ScriptComponentProps {
  script: Script;
  updateScript: any;
  isEditMode: boolean;
  removeScript: any;
  handleStopScript: any;
  isLoading: any;
  socket: any;
  project: ProjectData;
  setProjects: any;
  projects: any;
}

export interface ProjectCardProps {
  projectName: string;
  scripts: Script[];
  onStopScript: (project: any, scriptId: string) => Promise<void>;
  onRunAllScripts?: () => Promise<void>;
  onUpdateScripts?: (updatedScripts: Script[]) => Promise<void>;
  onEditProject?: () => void;
  onStopAllScripts: () => Promise<void>;
  onProjectDelete: (project: any) => void;
  project: any;
  sendScriptStart: any;
  projects: any;
  setProjects: any;
  sendScriptsStop: any;
  socket: any;
}

export interface ProjectFormValues {
  projectName: string;
  scriptCount: number;
  scripts: Script[];
  id: string; // This will store the timestamp in ms
}

export interface AddProjectProps {
  setProjects: React.Dispatch<React.SetStateAction<any[]>>;
  projects: any[];
}

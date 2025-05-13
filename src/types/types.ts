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
  activeScriptsIds: string[];
}

export interface ProjectCardProps {
  projectName: string;
  scripts: Script[];
  onRunScript: (project: any, scriptId: string) => Promise<void>;
  onStopScript: (scriptId: string) => Promise<void>;
  onRunAllScripts?: () => Promise<void>;
  onUpdateScripts?: (updatedScripts: Script[]) => Promise<void>;
  onEditProject?: () => void;
  onStopAllScripts: () => Promise<void>;
  onProjectDelete: (project: any) => void;
  activeScriptsIds: string[];
  project: any;
  sendSingleScriptStart: any
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

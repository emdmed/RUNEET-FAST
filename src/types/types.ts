export interface Script {
  id: string;
  name: string;
  script: string;
  absolutePath: string;
  port?: number;
  isRunning?: boolean;
  type: "frontend" | "backend" | "other";
}

export type Framework = "vite" | "server" | "next" | "react" | "default" | "custom";
export interface ProjectData {
  availableBranches: any;
  command: string;
  dependencies: any;
  devDependencies: any;
  filePath: string;
  framework: Framework;
  gitBranch: string | null;
  path: string;
  projectName: string
}

export interface ProcessesData {
  pid: string;
  tty: string;
  command: string;
  cwd: string;
  path: string
}

export interface ProjectProps {
  project: ProjectData;
  handleProjectSelect?: (project: ProjectData) => void;
  handleProjectAction: (action: string, project: ProjectData) => void;
  allActiveTerminals: ProcessesData[];
  fetchActiveTerminals: () => void
}

export interface PortHandler {
  vite: string;
  server: string;
  next: string;
  default: string;
  react: string,
  custom: string
}
export interface PortsResponse {
  ports: number[]
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

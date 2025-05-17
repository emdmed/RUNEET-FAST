import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "../ui/input";
import {
  Folder,
  Plus,
  Settings,
  Trash2,
  Code,
  Play,
  RefreshCw,
  Search,
  GitBranch,
  Package,
  X,
  Square,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import api from "@/utils/api";

const countDependencies = (project) => {
  const depCount = Object.keys(project.dependencies || {}).length;
  const devDepCount = Object.keys(project.devDependencies || {}).length;
  return { depCount, devDepCount };
};

export const ProjectCard = ({
  project,
  handleProjectSelect,
  handleProjectAction,
  allActiveTerminals,
}) => {
  const { depCount, devDepCount } = countDependencies(project);
  const [isActive, setIsActive] = useState(false);
  const [port, setPort] = useState("")

  useEffect(() => {
    if (!allActiveTerminals) return;
    const projectTerminal = allActiveTerminals.find(
      (t) => t.path === project.path
    );

    if (projectTerminal) {
      setIsActive(true);
    } else {
      setIsActive(false);
    }
  }, [allActiveTerminals]);

  const createCommand = (process, port) => {
    const portHandler = {
      vite: "-- --port",
      server: "-- --port",
      next: "-- -p",
      default: "-- --p",
      react: "-- --port",
    };

    const command = `${process.command} ${
      port
        ? `${portHandler[process?.framework || portHandler.default]} ${port}`
        : ""
    }`;
    return command;
  };

  const handleStartProject = async () => {
    const payload = {
      command: createCommand(project, port),
      path: project.path,
      port,
    };

    const response = await api.post(`api/run-command`, payload);
    console.log("response", response)
  };
  return (
    <Card
      key={project.path}
      className={`cursor-pointer p-1 gap-1 ${isActive ? "border-primary" : ""}`}
      onClick={() => handleProjectSelect(project)}
    >
      <CardHeader className="flex flex-row items-center justify-between p-2">
        <CardTitle className="text-md font-medium p-0 flex items-center gap-2">
          <span className={isActive ? `text-primary` : ""}>
            {project.projectName}
          </span>
          <Button
            size="icon"
            variant={isActive ? "destructiveGhost" : "primaryGhost"}
            onClick={(e) => {
              e.stopPropagation();
              handleStartProject()
            }}
            title={project.command}
          >
            {isActive ? <Square /> : <Play />}
          </Button>
          <Input
            onClick={(e) => e.stopPropagation()}
            className="w-[80px] h-[30px] text-center"
            placeholder="port"
            onChange={e => setPort(e.target.value)}
          />

          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              handleProjectAction("edit", project);
            }}
          >
            <Code className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              handleProjectAction("delete", project);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-1">
        <div className="flex justify-between items-center py-1">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline">{project.framework}</Badge>
              <GitBranch className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{project.gitBranch || "none"}</span>
            </div>
            <div className="flex items-center gap-1">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {depCount} deps, {devDepCount} devDeps
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

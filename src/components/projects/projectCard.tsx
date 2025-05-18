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
  fetchActiveTerminals,
}) => {
  const { depCount, devDepCount } = countDependencies(project);
  const [isActive, setIsActive] = useState(false);
  const [port, setPort] = useState("");

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

  const handleStopProject = async () => {
    const response = await api.post("api/kill-command", { path: project.path });

    if (response) fetchActiveTerminals();
  };

  const handleStartProject = async () => {
    const payload = {
      command: createCommand(project, port),
      path: project.path,
      port,
    };

    const response = await api.post(`api/run-command`, payload);

    if (response) {
      setTimeout(() => {
        fetchActiveTerminals();
      }, 3000);
    }
  };
  return (
    <Card
      key={project.path}
      className={`cursor-pointer p-0 gap-1 ${isActive ? "border-primary" : ""}`}
      onClick={() => handleProjectSelect(project)}
    >
      <CardContent className="flex gap-2 items-center justify-between">
        <div className="flex items-center gap-6">
          <span className={isActive ? `text-primary` : ""}>
            {project.projectName}
          </span>
          <Badge variant="outline">{project.framework}</Badge>

          <div className="flex items-center gap-2 p-1 border rounded">
            <Button
              size="icon"
              variant={isActive ? "destructiveGhost" : "primaryGhost"}
              onClick={(e) => {
                e.stopPropagation();

                if (isActive) {
                  handleStopProject();
                } else {
                  handleStartProject();
                }
              }}
              title={project.command}
            >
              {isActive ? <Square /> : <Play />}
            </Button>
            <Input
              onClick={(e) => e.stopPropagation()}
              className="w-[80px] h-[30px] text-center"
              placeholder="port"
              onChange={(e) => setPort(e.target.value)}
            />

            <Button
              size="icon"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                handleProjectAction("edit", project);
              }}
            >
              <Code className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                handleProjectAction("delete", project);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex justify-between items-center py-1">
          <div>
            <div className="flex items- justify-end gap-3 mb-2">
              <GitBranch className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{project.gitBranch || "none"}</span>
            </div>
            <div className="flex items- justify-end gap-1">
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

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";

const countDependencies = (project) => {
  const depCount = Object.keys(project.dependencies || {}).length;
  const devDepCount = Object.keys(project.devDependencies || {}).length;
  return { depCount, devDepCount };
};

export const ProjectCard = ({ project, handleProjectSelect, handleProjectAction }) => {
  const { depCount, devDepCount } = countDependencies(project);
  return (
    <Card
      key={project.path}
      className="cursor-pointer p-1"
      onClick={() => handleProjectSelect(project)}
    >
      <CardHeader className="flex flex-row items-center justify-between p-1">
        <CardTitle className="text-md font-medium">
          {project.projectName}
        </CardTitle>
        <Badge variant="outline">{project.framework}</Badge>
      </CardHeader>
      <CardContent className="p-1">
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center gap-1 mb-2">
              <GitBranch className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{project.gitBranch}</span>
            </div>
            <div className="flex items-center gap-1">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {depCount} deps, {devDepCount} devDeps
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                handleProjectAction("run", project);
              }}
              title={project.command}
            >
              <Play className="h-4 w-4" />
            </Button>
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

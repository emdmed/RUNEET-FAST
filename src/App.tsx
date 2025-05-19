import { useState, useEffect } from "react";
import { Folder, Plus, Search, Trash2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ProjectCard } from "./components/projects/projectCard";
import api from "./utils/api";
import { useProjectPersistence } from "./hooks/useProjectsPersistence";
import { PortScanner } from "./components/portScanner/portScanner";
import type { ProjectData, ProcessesData } from "./types/types";

const ProjectDashboard = () => {
  // Sample project data based on the provided structure
  const storedProjects = useProjectPersistence();
  const [projects, setProjects] = useState<ProjectData[]>(storedProjects || []);

  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(
    null
  );
  const [addProjectDialogOpen, setAddProjectDialogOpen] = useState(false);
  const [projectPath, setProjectPath] = useState("");
  const [allActiveTerminals, setAllActiveTerminals] = useState<ProcessesData[]>(
    []
  );
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const fetchActiveTerminals = async () => {
    const activeTerminalsResponse: any = await api.get("api/monitor-processes");
    setAllActiveTerminals(activeTerminalsResponse.terminals);
  };

  useEffect(() => {
    fetchActiveTerminals();

    const timer = setInterval(() => {
      fetchActiveTerminals()
    }, 2000);

    return () => clearInterval(timer)
  }, []);

  useEffect(() => {
    if (storedProjects) setProjects(storedProjects);
  }, [storedProjects]);

  // Filter projects based on search term and active tab
  const filteredProjects = projects
    .filter((project) => {
      const matchesSearch = project.projectName
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesTab = activeTab === "all" || project.framework === activeTab;
      return matchesSearch && matchesTab;
    })
    // First sort by active status (active projects first), then by projectName
    .sort((a, b) => {
      const isActiveA = allActiveTerminals.some(
        (terminal) => terminal.path === a.path
      );
      const isActiveB = allActiveTerminals.some(
        (terminal) => terminal.path === b.path
      );

      // If active status differs, sort by active status (active first)
      if (isActiveA !== isActiveB) {
        return isActiveA ? -1 : 1;
      }

      // If active status is the same, sort alphabetically by projectName
      return a.projectName.localeCompare(b.projectName);
    });

  const handleProjectSelect = (project: ProjectData | null) => {
    if (!project) return;
    setSelectedProject(project);
  };

  const handleProjectAction = (action: string, project: ProjectData) => {
    // In a real app, you would implement the actual actions here

    if (action === "delete") {
      setProjects(projects.filter((p) => p.path !== project.path));
      if (selectedProject && selectedProject.path === project.path) {
        setSelectedProject(null);
      }
    } else if (action === "run") {
      console.log(`Running command: ${project.command}`);
      // Here you would execute the project's command
    } else if (action === "changeBranch") {
      console.log(`Change branch functionality would be implemented here`);
      // Here you would handle git branch switching
    }
  };

  const handleAddProject = () => {
    setAddProjectDialogOpen(true);
  };

  const handleDeleteConfirmOpen = () => {
    setDeleteConfirmOpen(true);
  };

  const handleDeleteAllProjects = () => {
    setProjects([]);
    localStorage.setItem("projects", "[]");
    setDeleteConfirmOpen(false);
  };

  const handleAddProjectSubmit = async () => {
    if (!projectPath.trim()) {
      return; // Don't submit if path is empty
    }

    try {
      // Perform the POST request
      const response: any = await api.post("/api/find-packages", {
        directory: projectPath,
      });

      const newProject = response.packageJsonFiles;
      // Add the new project to the list
      setProjects([...projects, ...newProject]);

      // Close the dialog and reset the path
      setAddProjectDialogOpen(false);
      setProjectPath("");
      localStorage.setItem(
        "projects",
        JSON.stringify([...projects, ...newProject])
      );
    } catch (error) {
      console.error("Error adding project:", error);
      // In a real app, you would show an error message to the user
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 border-r">
        <div className="p-4">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-primary">Runeet</h1>
            <Zap size={16} className="text-primary" />
          </div>
          <Tabs
            defaultValue="all"
            value={activeTab}
            onValueChange={setActiveTab}
          >
            {/*             <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="favorites">Favorites</TabsTrigger>
            </TabsList> */}

            <Separator className="my-4" />

            <div className="space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => setActiveTab("all")}
              >
                <Folder className="mr-2 h-4 w-4" />
                All Projects
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => setActiveTab("next")}
              >
                <Folder className="mr-2 h-4 w-4" />
                Next
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => setActiveTab("react")}
              >
                <Folder className="mr-2 h-4 w-4" />
                React
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => setActiveTab("vite")}
              >
                <Folder className="mr-2 h-4 w-4" />
                Vite
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => setActiveTab("node")}
              >
                <Folder className="mr-2 h-4 w-4" />
                Node
              </Button>
            </div>
          </Tabs>

          <div className="flex flex-col mt-8 gap-2">
            <Button className="w-full" onClick={handleAddProject}>
              <Plus className="mr-2 h-4 w-4" />
              Add Projects
            </Button>
            <Button
              variant="destructiveOutline"
              className="w-full"
              onClick={handleDeleteConfirmOpen}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete all
            </Button>
          </div>
          <PortScanner />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b p-2">
          <div className="flex items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </div>

        {/* Project list */}
        <ScrollArea className="flex-1 p-4">
          <h2 className="text-lg font-medium mb-4">
            {activeTab === "all"
              ? "All Projects"
              : `${
                  activeTab.charAt(0).toUpperCase() + activeTab.slice(1)
                } Projects`}
          </h2>

          {filteredProjects.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No projects found. Try adjusting your search or filters.
            </div>
          ) : (
            <div
              className="flex flex-col gap-2 overflow-auto px-3"
              style={{ height: "calc(100vh - 120px)" }}
            >
              {filteredProjects.map((project) => {
                return (
                  <ProjectCard
                    key={project.path}
                    project={project}
                    handleProjectAction={handleProjectAction}
                    handleProjectSelect={handleProjectSelect}
                    allActiveTerminals={allActiveTerminals}
                    fetchActiveTerminals={fetchActiveTerminals}
                  />
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Project details dialog */}
      <Dialog
        open={selectedProject !== null}
        onOpenChange={(open) => !open && setSelectedProject(null)}
      >
        <DialogContent className="px-2 py-4">
          <DialogHeader>
            <DialogTitle>{selectedProject?.projectName} Details</DialogTitle>
            <DialogDescription>
              {selectedProject?.framework} project at {selectedProject?.path}
            </DialogDescription>
          </DialogHeader>

          {selectedProject && (
            <>
              <div className="flex flex-col gap-4 mb-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">
                    Framework
                  </h4>
                  <p className="capitalize">{selectedProject.framework}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">
                    Command
                  </h4>
                  <p>{selectedProject.command}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">
                    Project Path
                  </h4>
                  <p>{selectedProject.path}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">
                    Current Branch
                  </h4>
                  <div className="flex items-center gap-2">
                    <p>{selectedProject.gitBranch}</p>
                    {selectedProject.availableBranches.length > 0 && (
                      <Select
                        onValueChange={(value) =>
                          console.log(`Switch to branch: ${value}`)
                        }
                      >
                        <SelectTrigger className="w-fit">
                          <SelectValue placeholder="Switch" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedProject.availableBranches.map(
                            (branch: string) => (
                              <SelectItem key={branch} value={branch}>
                                {branch}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              </div>

              <Tabs defaultValue="dependencies">
                <TabsList>
                  <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
                  <TabsTrigger value="devDependencies">
                    Dev Dependencies
                  </TabsTrigger>
                </TabsList>
                <TabsContent
                  value="dependencies"
                  className="max-h-[300px] overflow-y-auto py-2"
                >
                  <div className="flex flex-col gap-2">
                    {Object.entries(selectedProject.dependencies || {}).length >
                    0 ? (
                      Object.entries(selectedProject.dependencies || {}).map(
                        ([name, version]: any) => (
                          <Badge
                            key={name}
                            variant="outline"
                            className="justify-between"
                          >
                            <span>{name}</span>
                            <span className="ml-2 text-muted-foreground">
                              {version}
                            </span>
                          </Badge>
                        )
                      )
                    ) : (
                      <p className="text-muted-foreground">
                        No dependencies found
                      </p>
                    )}
                  </div>
                </TabsContent>
                <TabsContent
                  value="devDependencies"
                  className="max-h-[300px] overflow-y-auto py-2"
                >
                  <div className="flex flex-col gap-2">
                    {Object.entries(selectedProject.devDependencies || {})
                      .length > 0 ? (
                      Object.entries(selectedProject.devDependencies || {}).map(
                        ([name, version]: any) => (
                          <Badge
                            key={name}
                            variant="outline"
                            className="justify-between"
                          >
                            <span>{name}</span>
                            <span className="ml-2 text-muted-foreground">
                              {version}
                            </span>
                          </Badge>
                        )
                      )
                    ) : (
                      <p className="text-muted-foreground">
                        No dev dependencies found
                      </p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              <DialogFooter className="mt-4 gap-2">
                <DialogClose asChild>
                  <Button variant="ghost">Close</Button>
                </DialogClose>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Project Dialog */}
      <Dialog
        open={addProjectDialogOpen}
        onOpenChange={setAddProjectDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Project</DialogTitle>
            <DialogDescription>
              Enter the absolute path to your project folder.
            </DialogDescription>
          </DialogHeader>

          <div className="my-4">
            <Input
              placeholder="/path/to/your/project"
              value={projectPath}
              onChange={(e) => setProjectPath(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddProjectDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleAddProjectSubmit}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete All Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete All Projects</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all projects from your dashboard. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAllProjects} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProjectDashboard;
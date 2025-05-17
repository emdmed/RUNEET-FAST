import React, { useState, useEffect } from "react";
import {
  Folder,
  Plus,
  Settings,
  Code,
  Play,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { ProjectCard } from "./components/projects/projectCard";
import api from "./utils/api";
import { useProjectPersistence } from "./hooks/useProjectsPersistence";

const ProjectDashboard = () => {
  // Sample project data based on the provided structure
  const storedProjects = useProjectPersistence();
  const [projects, setProjects] = useState(storedProjects || []);

  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedProject, setSelectedProject] = useState(null);
  const [addProjectDialogOpen, setAddProjectDialogOpen] = useState(false);
  const [projectPath, setProjectPath] = useState("");
  const [allActiveTerminals, setAllActiveTerminals] = useState([]);

  const fetchActiveTerminals = async () => {
    const activeTerminalsResponse = await api.get("api/monitor-processes");
    setAllActiveTerminals(activeTerminalsResponse.terminals);
  };

  useEffect(() => {
    fetchActiveTerminals();
  }, []);

  useEffect(() => {
    if (storedProjects) setProjects(storedProjects);
  }, [storedProjects]);

  // Filter projects based on search term and active tab
  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.projectName
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === "all" || project.framework === activeTab;
    return matchesSearch && matchesTab;
  })
  // Sort the filtered projects by projectName
  .sort((a, b) => a.projectName.localeCompare(b.projectName));

  const handleProjectSelect = (project) => {
    setSelectedProject(project);
  };

  const handleProjectAction = (action, project) => {
    console.log(`${action} project:`, project);
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

  const handleDeleteAllProjects = () => {
    setProjects([]);
    localStorage.setItem("projects", "[]");
  };

  const handleAddProjectSubmit = async () => {
    if (!projectPath.trim()) {
      return; // Don't submit if path is empty
    }

    try {
      // Perform the POST request
      const response = await api.post("/api/find-packages", {
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
          <h1 className="text-xl font-bold mb-6">Project Manager</h1>

          <Tabs
            defaultValue="all"
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="favorites">Favorites</TabsTrigger>
            </TabsList>

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
              onClick={handleDeleteAllProjects}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete all
            </Button>
          </div>
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
            <div className="flex flex-col gap-2 overflow-auto" style={{height: "calc(100vh - 120px)"}}>
              {filteredProjects.map((project) => {
                return (
                  <ProjectCard
                    key={project.path}
                    project={project}
                    handleProjectAction={handleProjectAction}
                    handleProjectSelect={handleProjectSelect}
                    allActiveTerminals={allActiveTerminals}
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
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedProject?.projectName} Details</DialogTitle>
            <DialogDescription>
              {selectedProject?.framework} project at {selectedProject?.path}
            </DialogDescription>
          </DialogHeader>

          {selectedProject && (
            <>
              <div className="grid grid-cols-2 gap-4 mb-4">
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
                          {selectedProject.availableBranches.map((branch) => (
                            <SelectItem key={branch} value={branch}>
                              {branch}
                            </SelectItem>
                          ))}
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
                <TabsContent value="dependencies" className="pt-4">
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(selectedProject.dependencies || {}).length >
                    0 ? (
                      Object.entries(selectedProject.dependencies || {}).map(
                        ([name, version]) => (
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
                <TabsContent value="devDependencies" className="pt-4">
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(selectedProject.devDependencies || {})
                      .length > 0 ? (
                      Object.entries(selectedProject.devDependencies || {}).map(
                        ([name, version]) => (
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

              <Alert className="mt-4">
                <RefreshCw className="h-4 w-4" />
                <AlertTitle>Project Information</AlertTitle>
                <AlertDescription>
                  This project uses {selectedProject.framework} and is located
                  at {selectedProject.path}. It's currently on the{" "}
                  {selectedProject.gitBranch} branch.
                </AlertDescription>
              </Alert>

              <DialogFooter className="mt-4 gap-2">
                <Button
                  variant="default"
                  className="gap-2"
                  onClick={() => handleProjectAction("run", selectedProject)}
                >
                  <Play className="h-4 w-4" />
                  Run ({selectedProject.command})
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => handleProjectAction("edit", selectedProject)}
                >
                  <Code className="h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() =>
                    handleProjectAction("settings", selectedProject)
                  }
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Button>
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
    </div>
  );
};

export default ProjectDashboard;
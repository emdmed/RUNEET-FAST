import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";

interface Script {
  name: string;
  absolutePath: string;
  script: string;
  port?: number;
  type: "frontend" | "backend"; // Added type field
  id?: string; // Add ID field
}

interface ProjectFormValues {
  projectName: string;
  scriptCount: number;
  scripts: Script[];
  id: string; // This will store the timestamp in ms
}

interface AddProjectProps {
  setProjects: React.Dispatch<React.SetStateAction<any[]>>;
  projects: any[];
}

const AddProject = ({ setProjects, projects }: AddProjectProps) => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [currentScriptIndex, setCurrentScriptIndex] = useState(0);

  const [formValues, setFormValues] = useState<ProjectFormValues>({
    projectName: "",
    id: "",
    scriptCount: 1,
    scripts: [],
  });

  const handleFirstStepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleScriptCountChange = (value: string) => {
    let count = 0;
    let scriptTemplates = [];

    if (value === "1") {
      count = 1;
      scriptTemplates = [
        {
          name: "Frontend",
          type: "frontend",
          absolutePath: "",
          script: "",
          port: undefined,
          id: `script-${Date.now()}-1`, // Add unique ID
        },
      ];
    } else if (value === "1_backend") {
      count = 1;
      scriptTemplates = [
        {
          name: "Backend",
          type: "backend",
          absolutePath: "",
          script: "",
          port: undefined,
          id: `script-${Date.now()}-1`, // Add unique ID
        },
      ];
    } else if (value === "2") {
      count = 2;
      scriptTemplates = [
        {
          name: "Frontend",
          type: "frontend",
          absolutePath: "",
          script: "",
          port: undefined,
          id: `script-${Date.now()}-1`, // Add unique ID
        },
        {
          name: "Backend",
          type: "backend",
          absolutePath: "",
          script: "",
          port: undefined,
          id: `script-${Date.now()}-2`, // Add unique ID
        },
      ];
    }

    setFormValues((prev) => ({
      ...prev,
      scriptCount: count,
      scripts: scriptTemplates.map(
        (template, i) => prev.scripts[i] || template
      ),
    }));
  };

  const handleScriptChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    index: number
  ) => {
    const { name, value } = e.target;
    setFormValues((prev) => {
      const updatedScripts = [...prev.scripts];
      updatedScripts[index] = {
        ...updatedScripts[index],
        [name]: name === "port" ? (value ? Number(value) : undefined) : value,
      };
      return {
        ...prev,
        scripts: updatedScripts,
      };
    });
  };

  const goToNextStep = () => {
    if (step === 1) {
      // Initialize scripts array if going from step 1 to step 2
      if (formValues.scripts.length === 0) {
        setFormValues((prev) => ({
          ...prev,
          id: Date.now().toString(), // Set the id to current timestamp in ms
          scripts: Array(prev.scriptCount)
            .fill(null)
            .map((_, i) => ({
              name: i === 0 ? "Frontend" : "Backend",
              type: i === 0 ? "frontend" : "backend", // Set type based on index
              absolutePath: "",
              script: "",
              port: undefined,
              id: `script-${Date.now()}-${i}`, // Add unique ID
            })),
        }));
      } else {
        // If scripts already exist but id is empty, set the id
        if (!formValues.id) {
          setFormValues((prev) => ({
            ...prev,
            id: Date.now().toString(), // Set the id to current timestamp in ms
          }));
        }
      }
      setStep(2);
      setCurrentScriptIndex(0);
    } else if (step === 2) {
      // If we're at the last script, finalize the form
      if (currentScriptIndex === formValues.scriptCount - 1) {
        handleFinalSubmit();
      } else {
        // Otherwise go to the next script configuration
        setCurrentScriptIndex(currentScriptIndex + 1);
      }
    }
  };

  const goToPreviousStep = () => {
    if (step === 2 && currentScriptIndex === 0) {
      setStep(1);
    } else if (step === 2) {
      setCurrentScriptIndex(currentScriptIndex - 1);
    }
  };

  const handleFinalSubmit = () => {
    console.log("Form submitted with values:", formValues);
    
    // Ensure the id is set before submitting
    const finalFormValues = {
      ...formValues,
      id: formValues.id || Date.now().toString(), // Use existing id or create new one
    };
    
    // Ensure all scripts have IDs
    finalFormValues.scripts = finalFormValues.scripts.map((script, index) => {
      if (!script.id) {
        return {
          ...script,
          id: `script-${Date.now()}-${index}`,
        };
      }
      return script;
    });
    
    setProjects([...projects, finalFormValues]);
    // Here you would handle the actual submission logic

    // Reset and close the dialog after submission
    setStep(1);
    setCurrentScriptIndex(0);
    setOpen(false);
  };

  const resetForm = () => {
    setFormValues({
      id: "",
      projectName: "",
      scriptCount: 1,
      scripts: [],
    });
    setStep(1);
    setCurrentScriptIndex(0);
  };

  const getCurrentScriptName = () => {
    return formValues.scripts[currentScriptIndex]?.name || "Script";
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="default">New <Plus/></Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {step === 1
              ? "Project Configuration"
              : `Script Configuration (${currentScriptIndex + 1}/${
                  formValues.scriptCount
                })`}
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? "Enter your project details"
              : `Set up ${getCurrentScriptName()} script details`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {step === 1 ? (
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="projectName">Project Name</Label>
                <Input
                  id="projectName"
                  name="projectName"
                  placeholder="My Awesome Project"
                  value={formValues.projectName}
                  onChange={handleFirstStepChange}
                />
                <p className="text-sm text-muted-foreground">
                  Enter a name for your project
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="scriptType">Script Type</Label>
                <Select
                  value={formValues.scriptCount.toString()}
                  onValueChange={handleScriptCountChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select script type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Frontend Only</SelectItem>
                    <SelectItem value="1_backend">Backend Only</SelectItem>
                    <SelectItem value="2">Frontend and Backend</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Select the type of scripts you need for your project
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Script Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder={getCurrentScriptName()}
                  value={formValues.scripts[currentScriptIndex]?.name || ""}
                  onChange={(e) => handleScriptChange(e, currentScriptIndex)}
                />
                <p className="text-sm text-muted-foreground">
                  A name to identify this script
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="type">Script Type</Label>
                <Select
                  value={formValues.scripts[currentScriptIndex]?.type || "frontend"}
                  onValueChange={(value) => {
                    setFormValues((prev) => {
                      const updatedScripts = [...prev.scripts];
                      updatedScripts[currentScriptIndex] = {
                        ...updatedScripts[currentScriptIndex],
                        type: value as "frontend" | "backend",
                      };
                      return {
                        ...prev,
                        scripts: updatedScripts,
                      };
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select script type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="frontend">Frontend</SelectItem>
                    <SelectItem value="backend">Backend</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  The type of script
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="absolutePath">Absolute Path</Label>
                <Input
                  id="absolutePath"
                  name="absolutePath"
                  placeholder="/path/to/your/project"
                  value={
                    formValues.scripts[currentScriptIndex]?.absolutePath || ""
                  }
                  onChange={(e) => handleScriptChange(e, currentScriptIndex)}
                />
                <p className="text-sm text-muted-foreground">
                  The absolute path to the{" "}
                  {getCurrentScriptName().toLowerCase()} directory
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="script">Script</Label>
                <Textarea
                  id="script"
                  name="script"
                  placeholder={
                    formValues.scripts[currentScriptIndex]?.type === "frontend" 
                      ? "npm run dev" 
                      : "npm run server"
                  }
                  value={formValues.scripts[currentScriptIndex]?.script || ""}
                  onChange={(e) => handleScriptChange(e, currentScriptIndex)}
                />
                <p className="text-sm text-muted-foreground">
                  The script to run your {getCurrentScriptName().toLowerCase()}
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="port">Port (Optional)</Label>
                <Input
                  id="port"
                  name="port"
                  type="number"
                  placeholder={
                    formValues.scripts[currentScriptIndex]?.type === "frontend" 
                      ? "3000" 
                      : "8080"
                  }
                  value={formValues.scripts[currentScriptIndex]?.port || ""}
                  onChange={(e) => handleScriptChange(e, currentScriptIndex)}
                />
                <p className="text-sm text-muted-foreground">
                  The port to run the {getCurrentScriptName().toLowerCase()} on
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={goToPreviousStep}
                className="mr-auto"
              >
                Back
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={goToNextStep}
              disabled={step === 1 && !formValues.projectName}
            >
              {step === 1
                ? "Next"
                : currentScriptIndex === formValues.scriptCount - 1
                ? "Finish"
                : "Next Script"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddProject;
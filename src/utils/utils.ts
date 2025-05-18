// Helper functions for project and script management
import type { Script, ProjectData } from "@/types/types";
/**
 * Ensures all scripts have unique IDs
 * @param {Array} scripts - Array of script objects
 * @returns {Array} - Array of scripts with IDs
 */
export const ensureScriptIds = (scripts: Script[]) => {
  return scripts.map((script, index) => {
    if (!script.id) {
      return {
        ...script,
        id: `script-${Date.now()}-${index}-${Math.random()
          .toString(36)
          .substring(2, 9)}`,
      };
    }
    return script;
  });
};

/**
 * Deep clones a project to avoid reference issues
 * @param {Object} project - Project object
 * @returns {Object} - Deep cloned project
 */
export const cloneProject = (project: ProjectData) => {
  return JSON.parse(JSON.stringify(project));
};

/**
 * Gets a project by ID from the projects array
 * @param {Array} projects - Array of projects
 * @param {string} projectId - Project ID to find
 * @returns {Object|null} - Found project or null
 */

/**
 * Gets a script by ID from a project
 * @param {Object} project - Project object
 * @param {string} scriptId - Script ID to find
 * @returns {Object|null} - Found script or null
 */

/**
 * Updates a specific script in a project
 * @param {Object} project - Project object
 * @param {string} scriptId - ID of script to update
 * @param {Object} updatedScript - New script data
 * @returns {Object} - Updated project
 */
export const updateScript = (
  project: any,
  scriptId: string,
  updatedScript: any
) => {
  if (!project || !project.scripts) return project;

  const updatedScripts = project.scripts.map((script: Script) =>
    script.id === scriptId ? { ...script, ...updatedScript } : script
  );

  return {
    ...project,
    scripts: updatedScripts,
  };
};

/**
 * Saves projects to localStorage
 * @param {Array} projects - Projects array to save
 */
export const saveProjectsToStorage = (projects: any) => {
  try {
    localStorage.setItem("projects", JSON.stringify(projects));
  } catch (error) {
    console.error("Error saving projects to localStorage:", error);
  }
};

/**
 * Loads projects from localStorage
 * @returns {Array} - Projects array or empty array if none found
 */
export const loadProjectsFromStorage = () => {
  try {
    const projectsData = localStorage.getItem("projects");
    return projectsData ? JSON.parse(projectsData) : [];
  } catch (error) {
    console.error("Error loading projects from localStorage:", error);
    return [];
  }
};

/**
 * Toggles a script's running state
 * @param {Object} script - Script object
 * @returns {Object} - Updated script with toggled running state
 */
export const toggleScriptRunningState = (script: any) => {
  if (!script) return script;
  return {
    ...script,
    isRunning: !script.isRunning,
  };
};

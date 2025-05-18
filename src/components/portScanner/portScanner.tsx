import { useEffect, useState } from "react";
import api from "@/utils/api";
import { Badge } from "../ui/badge";
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

import type { PortsResponse } from "@/types/types";

export const PortScanner = () => {
  const [ports, setPorts] = useState<number[]>([]);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedPort, setSelectedPort] = useState<string | number | null>(
    null
  );

  const fetchPorts = async () => {
    const response: PortsResponse = await api.get(`api/used-ports`);
    setPorts(response.ports);
  };

  const openConfirmDialog = (port: string | number) => {
    setSelectedPort(port);
    setIsConfirmOpen(true);
  };

  const handleConfirm = async () => {
    try {
      await api.post("api/kill-command", { port: selectedPort });
      // Optionally add success feedback here
    } catch (error) {
      console.error("Failed to kill process on port:", error);
      // Optionally add error handling here
    } finally {
      setIsConfirmOpen(false);
      setSelectedPort(null);
    }
  };

  const handleCancel = () => {
    setIsConfirmOpen(false);
    setSelectedPort(null);
  };

  useEffect(() => {
    // Initial fetch
    fetchPorts();

    const interval = setInterval(() => {
      fetchPorts();
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div className="flex flex-col gap-2 items-center mt-4 border-t p-2">
        <small>Ports in use: </small>
        <div className="grid grid-cols-4 gap-4">
          {ports.map((port) => (
          <Badge
            key={port}
            onClick={() => openConfirmDialog(port)}
            className="hover:border-destructive cursor-pointer"
            variant="outline"
          >
            {port}
          </Badge>
        ))}
        </div>
      </div>

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kill Process Confirmation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to kill the process running on port{" "}
              {selectedPort}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Kill Process
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

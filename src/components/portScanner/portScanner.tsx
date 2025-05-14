import api from "@/utils/api";
import { useEffect, useState } from "react";
import { Badge } from "../ui/badge";

export const PortScanner = () => {
  const [ports, setPorts] = useState([]);
  const fetchPorts = async () => {
    const response:any = await api.get(`api/used-ports`);
    setPorts(response.ports);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      fetchPorts();
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex gap-2 items-center">
      <small>Ports in use: </small>
      {ports.map((port) => (
        <Badge variant="outline">{port}</Badge>
      ))}
    </div>
  );
};

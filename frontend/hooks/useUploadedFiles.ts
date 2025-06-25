import { useEffect, useState, useCallback } from "react";
import api from "@/lib/axios";
import { UploadedFile } from "@/types/global";

export const useUploadedFiles = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/uploaded-files/");
      setFiles(res.data);
    } catch (err) {
      console.error("Failed to fetch uploaded files", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Call on mount
  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  // Expose refetch to consumers
  return { files, loading, refetch: fetchFiles };
};

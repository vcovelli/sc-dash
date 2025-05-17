import { useEffect, useState } from "react"
import api from "@/lib/axios";
import { UploadedFile } from "@/types/global"

export const useUploadedFiles = () => {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const res = await api.get("/api/uploaded-files");
        setFiles(res.data)
      } catch (err) {
        console.error("Failed to fetch uploaded files", err)
      } finally {
        setLoading(false)
      }
    }

    fetchFiles()
  }, [])

  return { files, loading }
}

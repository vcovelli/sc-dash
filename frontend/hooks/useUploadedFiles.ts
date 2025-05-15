import { useEffect, useState } from "react"
import axios from "axios"
import { UploadedFile } from "@/types/global"

export const useUploadedFiles = () => {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/uploaded-files`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        })
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

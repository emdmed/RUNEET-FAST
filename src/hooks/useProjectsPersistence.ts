import { useEffect } from "react"
import { useState } from "react"

export const useProjectPersistence = () => {
    const [storedData, setStoredData] = useState(null)

    useEffect(() => {
        const stringData = localStorage.getItem("projects")
        if (!stringData) return

        const pathCards = JSON.parse(stringData)
        setStoredData(pathCards)
    }, [])


    return storedData
}

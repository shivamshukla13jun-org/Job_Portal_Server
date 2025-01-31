
export const createRegex = (value: string) => new RegExp(`.*${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}.*`, "gi");
export const fromStringToJSON=(value:string)=>{
    try {
        return JSON.parse(value)
    } catch (error) {
        return undefined
    }
}
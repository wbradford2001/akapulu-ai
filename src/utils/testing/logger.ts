export function customLog(input: string, level: number){
    if (process.env.LOG_LEVEL && Number(process.env.LOG_LEVEL) >= level){
        console.log(input)
    }
}
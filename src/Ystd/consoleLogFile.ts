export const consoleLogFile = (filePath: string, content: string) => {
    console.log("###################################################################");
    console.log(filePath);
    console.log("## --------------------- BEGIN OF FILE ------------------------- ##");
    console.log(content);
    console.log("######################## END OF FILE ##############################");
};

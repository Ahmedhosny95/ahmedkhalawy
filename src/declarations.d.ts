declare module './search-data.js' { export const routes: Record<string, {title:string;description:string;url:string;image:string}>; export const schema: (path:string)=>unknown; }

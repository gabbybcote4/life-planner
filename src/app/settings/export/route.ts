import {getAccountContext} from "@/lib/auth/account";
import {validExport,exportFilename,EXPORT_MAX_BYTES} from "@/lib/export/schema";
const privateHeaders={"Cache-Control":"private, no-store, max-age=0","Pragma":"no-cache","Vary":"Cookie, Authorization","X-Content-Type-Options":"nosniff"};
function failure(error:string,status:number){return Response.json({error},{status,headers:privateHeaders});}
export async function POST(request:Request){
 if(request.headers.get("origin")!==new URL(request.url).origin)return failure("Open Settings in your planner to download data.",403);
 try{const account=await getAccountContext();if(!account)return failure("Sign in again before exporting.",401);
 const {data,error}=await account.supabase.rpc("planner_export_data");
 if(error)return failure(error.code==="54000"?"Your planner is too large for this export. No partial file was created.":"Export could not be prepared. Check the export setup and connection.",error.code==="54000"?413:503);
 if(!validExport(data))return failure("Export was incomplete or unrecognized. No file was created.",502);
 const content=JSON.stringify(data);if(new TextEncoder().encode(content).byteLength>EXPORT_MAX_BYTES)return failure("Export exceeds the download limit. No partial file was created.",413);
 return new Response(content,{headers:{...privateHeaders,"Content-Type":"application/json; charset=utf-8","Content-Disposition":'attachment; filename="'+exportFilename(data)+'"'}});
 }catch{return failure("Export unavailable. Your saved data is unchanged.",503);}
}

import { getStore } from '@netlify/blobs';
import { authorized, validateSettings } from '../lib/reminder-core.mjs';
export default async request=>{
 if(!authorized(request,process.env.REMINDER_EDIT_KEY))return Response.json({error:'Nhập mã quản lý lịch đúng với REMINDER_EDIT_KEY trên Netlify.'},{status:401});
 const store=getStore({name:'charterprep-reminders',consistency:'strong'});
 if(request.method==='GET')return Response.json({settings:await store.get('settings',{type:'json'})});
 if(request.method!=='POST')return new Response(null,{status:405});
 try{
 const raw=await request.text();if(raw.length>200000)return new Response(null,{status:413});
 const p=validateSettings(JSON.parse(raw));
 await store.setJSON('settings',p);
 return Response.json({ok:true,updatedAt:p.updatedAt});
 }catch(e){return Response.json({error:e.message||'Chưa lưu được lịch.'},{status:400});}
};

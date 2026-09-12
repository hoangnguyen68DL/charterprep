import { getStore } from '@netlify/blobs';
import { createHash } from 'node:crypto';
import { dayAt,due } from './reminder-core.mjs';
import { CharterEmailTemplate } from './email-template.mjs';
export async function run(kind){
 const store=getStore({name:'charterprep-reminders',consistency:'strong'}),p=await store.get('settings',{type:'json'}),now=new Date();
 if(!p||!due(p,kind,now))return new Response(null,{status:204});
 const date=dayAt(now),key='delivery/'+date+'/'+kind;
 let job=await store.get(key,{type:'json'});
 if(job?.sent)return new Response(null,{status:204});
 if(!job){
 const selected=p.planDate===date&&p.selected.length?p.selected:p.upcoming;
 const goal=p.goal.date===date?p.goal:{date,target:selected.length,completed:0,shortfall:selected.length};
 const subject='CharterPrep · '+(kind==='morning'?'Kế hoạch học hôm nay':'Kiểm tra cuối ngày')+' · '+date;
 let html=CharterEmailTemplate({kind,name:p.name,subject,goal,modules:selected});
 if(p.goal.date!==date)html=html.replace('Tiến độ theo lần đồng bộ gần nhất từ web.','Chưa có tiến độ đồng bộ cho hôm nay. Các số trên là kế hoạch dự kiến, chưa xác nhận số bài đã học.');
 const tomorrow=dayAt(new Date(+now+86400000));
 if(kind==='evening'&&p.planDate===tomorrow&&p.selected.length){
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 html=html.replace('</body>',`<div style="max-width:544px;margin:0 auto 28px;padding:28px;background:white;font-family:Arial;color:#18233c"><h2>Module bạn chọn cho ngày mai</h2><ul>${p.selected.map(m=>'<li style="margin-bottom:12px">'+esc(m.name)+'</li>').join('')}</ul></div></body>`);
 }
 const draft={to:p.email,subject,html,from:process.env.RESEND_FROM||'CharterPrep <onboarding@resend.dev>'};
 await store.setJSON(key,draft,{onlyIfNew:true});job=await store.get(key,{type:'json'});
 }
 const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+process.env.RESEND_API_KEY,'Content-Type':'application/json','Idempotency-Key':'charterprep/'+kind+'/'+date+'/'+createHash('sha256').update(job.to).digest('hex').slice(0,24)},body:JSON.stringify({from:job.from,to:[job.to],subject:job.subject,html:job.html})});
 const result=await response.json();if(!response.ok)return Response.json({error:result.message},{status:response.status});
 await store.setJSON(key,{...job,sent:true,id:result.id});return Response.json({ok:true});
}

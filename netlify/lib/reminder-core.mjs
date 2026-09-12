import { createHash, timingSafeEqual } from 'node:crypto';
export const dayAt = now => new Date(+now+7*3600000).toISOString().slice(0,10);
export function authorized(request, secret) {
 const supplied=(request.headers.get('authorization')||'').replace(/^Bearer /,'');
 return !!secret && !!supplied && timingSafeEqual(createHash('sha256').update(supplied).digest(),createHash('sha256').update(secret).digest());
}
export function validateSettings(p) {
 if(!p||!/^\S+@\S+\.\S+$/.test(p.email||'')) throw Error('Email không hợp lệ.');
 for(const k of ['morning','evening','onlyIfBehind']) if(typeof p[k]!=='boolean')throw Error('Lựa chọn không hợp lệ.');
 for(const k of ['morningTime','eveningTime'])if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(p[k]||''))throw Error('Giờ không hợp lệ.');
 if(!Array.isArray(p.days)||p.days.some(d=>!Number.isInteger(d)||d<0||d>6))throw Error('Ngày không hợp lệ.');
 const modules=list=>{if(!Array.isArray(list)||list.length>500)throw Error('Danh sách bài không hợp lệ.');return list.map(m=>({id:String(m.id).slice(0,200),name:String(m.name).slice(0,500),topic:String(m.topic).slice(0,200)}));};
 const goal=p.goal;
 if(!goal||!/^\d{4}-\d{2}-\d{2}$/.test(goal.date)||['target','completed','shortfall'].some(k=>!Number.isFinite(goal[k])||goal[k]<0))throw Error('Tiến độ không hợp lệ.');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(p.planDate||''))throw Error('Ngày học không hợp lệ.');
 return {email:p.email.trim().toLowerCase(),name:String(p.name||'bạn').slice(0,100),morning:p.morning,evening:p.evening,morningTime:p.morningTime,eveningTime:p.eveningTime,onlyIfBehind:p.onlyIfBehind,days:[...new Set(p.days)],goal:{date:goal.date,target:goal.target,completed:goal.completed,shortfall:goal.shortfall},planDate:p.planDate,selected:modules(p.selected),upcoming:modules(p.upcoming),updatedAt:new Date().toISOString()};
}
export function due(p,kind,now=new Date()) {
 const local=new Date(+now+7*3600000),date=dayAt(now),minute=local.getUTCHours()*60+local.getUTCMinutes();
 const [h,m]=p[kind+'Time'].split(':').map(Number);
 if(!p[kind]||!p.days.includes(local.getUTCDay())||minute<h*60+m||minute>=h*60+m+10)return false;
 if(kind==='evening'&&p.onlyIfBehind&&p.goal.date===date&&p.goal.shortfall===0)return false;
 return true;
}

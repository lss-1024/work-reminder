'use strict';
// All reminder data stays in the signed-in page; only delivery markers are stored locally.
let reminderTasks=[],reminderOwner=null,reminderToken=null;
const reminderById=id=>document.getElementById(id);
function reminderSlot(now=new Date()){
  const parts=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',hourCycle:'h23'}).formatToParts(now).map(p=>[p.type,p.value]));
  const hour=Number(parts.hour);if(hour<10)return null;
  return parts.year+'-'+parts.month+'-'+parts.day+'/'+(hour>=17?'17:00':'10:00');
}
function reminderActionable(t){return t.status!=='已完成'&&!/等待|不再提醒|执行期结束|已取消|已关闭|已删除|待确认归属|不纳入个人管理/.test(t.status);}
function reminderKey(){return 'board-reminder-v1:'+location.host+':'+reminderOwner;}
function reminderState(){try{return JSON.parse(localStorage.getItem(reminderKey()))||{};}catch{return {};}}
function saveReminderState(state){try{localStorage.setItem(reminderKey(),JSON.stringify(state));}catch{ /* Current-tab delivery still works if browser storage is disabled. */ }}
function reminderRows(){
  const list=reminderById('reminder-list');list.replaceChildren();
  const active=reminderTasks.filter(reminderActionable).sort((a,b)=>Number(a.id.slice(1))-Number(b.id.slice(1)));
  reminderById('reminder-summary').textContent='未完成共 '+active.length+' 项';
  for(const t of active){const row=document.createElement('article');row.className='reminder-row';for(const text of ['编号：'+t.id,'状态：'+t.status,'事项：'+t.title,'截止：'+(t.due||'未明确')]){const p=document.createElement('p');p.textContent=text;row.append(p);}if(!window.boardReadOnly){const button=document.createElement('button');button.textContent='标为完成';button.onclick=()=>window.completeBoardTask(t.id);row.append(button);}list.append(row);}
  if(!active.length){const p=document.createElement('p');p.textContent='当前没有需要行动的事项。';list.append(p);}
}
function checkReminder(now=new Date()){
  if(!window.cloudLoggedIn||!reminderOwner||document.visibilityState!=='visible'||reminderById('editor').open||reminderById('new-dialog').open||reminderById('reminder-dialog').open)return;
  const token=reminderSlot(now);if(!token||!reminderTasks.some(reminderActionable))return;
  const state=reminderState();if(state.token===token&&(!state.snoozeUntil||now.getTime()<state.snoozeUntil))return;
  if(reminderToken===token&&!state.snoozeUntil)return;
  reminderRows();reminderById('reminder-dialog').showModal();reminderToken=token;saveReminderState({token});
}
window.updateBoardReminders=(tasks,owner)=>{if(!window.cloudLoggedIn&&!window.boardVisible)return;if(owner!==reminderOwner){reminderToken=null;reminderById('reminder-dialog').close();}reminderOwner=owner;reminderTasks=tasks;if(reminderById('reminder-dialog').open)reminderRows();checkReminder();};
window.clearBoardReminders=()=>{reminderTasks=[];reminderOwner=null;reminderToken=null;reminderById('reminder-list').replaceChildren();reminderById('reminder-dialog').close();};
reminderById('reminder-close').onclick=()=>reminderById('reminder-dialog').close();
reminderById('reminder-snooze').onclick=()=>{if(reminderOwner){saveReminderState({token:reminderSlot(),snoozeUntil:Date.now()+10*60*1000});}reminderById('reminder-dialog').close();};
reminderById('reminder-preview').onclick=async()=>{if(!window.cloudLoggedIn&&!window.boardVisible)return;const ok=await window.refreshBoard();if(ok!==true)return;reminderRows();if(!reminderById('reminder-dialog').open)reminderById('reminder-dialog').showModal();};
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&(window.cloudLoggedIn||window.boardVisible))window.refreshBoard();});
window.addEventListener('storage',event=>{if(reminderOwner&&event.key===reminderKey())checkReminder();});

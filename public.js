'use strict';
// No shared password or user token is embedded in the public viewer.
window.publicBoardMode = new URLSearchParams(location.search).get('manage') !== '1';
window.boardReadOnly = window.publicBoardMode;
window.publicBoardOwner = null;
window.readPublicBoard = async () => {
 const response = await fetch(window.BOARD_CONFIG.url+'/rest/v1/rpc/get_public_reminder_board',{
  method:'POST',headers:{apikey:window.BOARD_CONFIG.key,'Content-Type':'application/json'},body:'{}'
 });
 if(!response.ok)throw Error('公共只读入口尚未配置或暂不可用；请由管理员在 Supabase 执行权限设置');
 const data=await response.json();
 if(!data||!Array.isArray(data.tasks)||typeof data.ownerId!=='string')throw Error('公共看板尚未启用');
 window.publicBoardOwner=data.ownerId;
 return data;
};
window.applyBoardAudience = () => {
 const readonly=window.boardReadOnly;
 for(const id of ['new','import','import-file','logout'])document.getElementById(id).hidden=readonly;
 document.getElementById('public-notice').hidden=!readonly;
 document.getElementById('manage-link').hidden=!readonly;
 document.getElementById('viewer-title').textContent=readonly?'公共提醒事项':'我的提醒事项';
 document.getElementById('audience-label').textContent=readonly?'公共查看 · 只读':'个人任务 · 私有云端';
 document.getElementById('audience-note').textContent=readonly?'免登录查看公开账号的全部任务与关联资料。不能新增、编辑或完成任务。资料可被访问者下载和转发。':'登录后管理本人云端数据。云端与本地知识库尚未自动互通，网页弹窗需要保持页面打开。';
};

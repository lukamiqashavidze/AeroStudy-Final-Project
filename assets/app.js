'use strict';
(() => {
  const STORAGE_KEY = 'aerostudy.tasks.v1';
  const demoTasks = [
    {id:'sample-1',title:'JavaScript-ის პრაქტიკული დავალების დასრულება',subject:'პროგრამირება',due:'',notes:'DOM და მოვლენების დამუშავება',completed:false,createdAt:1},
    {id:'sample-2',title:'მათემატიკის კონსპექტის გადახედვა',subject:'მათემატიკა',due:'',notes:'მატრიცები და დეტერმინანტები',completed:true,createdAt:2},
    {id:'sample-3',title:'ინგლისურის ახალი ტერმინების სწავლა',subject:'ინგლისური',due:'',notes:'დღეში 15 ტერმინი',completed:false,createdAt:3}
  ];
  const $ = (selector) => document.querySelector(selector);
  const dom = {list:$('#taskList'),empty:$('#emptyState'),dialog:$('#taskDialog'),form:$('#taskForm'),title:$('#taskTitle'),id:$('#taskId'),subject:$('#taskSubject'),due:$('#taskDue'),notes:$('#taskNotes'),error:$('#formError')};
  const validTask = (task) => task && typeof task.id === 'string' && typeof task.title === 'string' && typeof task.completed === 'boolean';
  let tasks;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === null) { tasks = demoTasks.map(x => ({...x})); localStorage.setItem(STORAGE_KEY,JSON.stringify(tasks)); }
    else { const parsed = JSON.parse(saved); tasks = Array.isArray(parsed) ? parsed.filter(validTask) : []; }
  } catch { tasks = demoTasks.map(x => ({...x})); }
  let filter = 'all';
  let search = '';
  let toastTimer;
  const tips = [
    'დაყავი დიდი დავალება მცირე ნაბიჯებად — ასე დაწყება უფრო მარტივია.',
    'ყოველ 25 წუთში მცირე შესვენება გააკეთე, შემდეგ კი ფოკუსს დაუბრუნდი.',
    'დღის ბოლოს მონიშნე შესრულებული საქმეები და ხვალინდელი პრიორიტეტი.'
  ];
  let tipIndex = 0;
  function notify(message) { const element=$('#toast'); element.textContent=message; element.classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>element.classList.remove('show'),2700); }
  function persist() { try { localStorage.setItem(STORAGE_KEY,JSON.stringify(tasks)); return true; } catch {notify('ბრაუზერში შენახვა ვერ მოხერხდა. გადაამოწმე სივრცე ან პარამეტრები.');return false;} }
  function textElement(tag,text,className) {const element=document.createElement(tag);element.textContent=text;if(className) element.className=className;return element;}
  function prettyDate(value) {if(!/^\d{4}-\d{2}-\d{2}$/.test(value||''))return '';const [y,m,d]=value.split('-');return `${d}.${m}.${y}`;}
  function getVisibleTasks() {const term=search.trim().toLocaleLowerCase('ka');return tasks.filter(t=>(filter==='all'||(filter==='completed'?t.completed:!t.completed))&&(`${t.title} ${t.subject||''} ${t.notes||''}`).toLocaleLowerCase('ka').includes(term)).sort((a,b)=>{const mode=$('#sortSelect').value;if(mode==='title')return a.title.localeCompare(b.title,'ka');if(mode==='due')return (a.due||'9999').localeCompare(b.due||'9999')||b.createdAt-a.createdAt;return b.createdAt-a.createdAt;});}
  function render() {
    const completed=tasks.filter(t=>t.completed).length, active=tasks.length-completed;
    const percent=tasks.length?Math.round(completed/tasks.length*100):0;
    $('#totalCount').textContent=tasks.length;$('#activeCount').textContent=active;$('#completedCount').textContent=completed;$('#progressPercent').textContent=`${percent}%`;$('#progressFill').style.width=`${percent}%`;$('#progressBar').setAttribute('aria-valuenow',String(percent));
    const visible=getVisibleTasks();$('#listSummary').textContent=`${visible.length} დავალება`;$('#remainingNote').textContent=active?`${active} დავალება ელოდება შესრულებას`:'ყველა დავალება შესრულებულია ✦';$('#clearCompleted').disabled=!completed;
    dom.list.replaceChildren();dom.empty.hidden=visible.length!==0;
    for(const task of visible){
      const row=document.createElement('li');row.className=`task-item${task.completed?' done':''}`;row.dataset.id=task.id;
      const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.className='task-check';checkbox.checked=task.completed;checkbox.setAttribute('aria-label',`შესრულებულად მონიშვნა: ${task.title}`);checkbox.dataset.action='toggle';row.append(checkbox);
      const info=textElement('div','','task-info');info.append(textElement('span',task.title,'task-name'));
      const meta=textElement('div','','task-meta');meta.append(textElement('span',task.subject||'ზოგადი','category-chip'));
      if(task.due){const dateTag=textElement('span',`ვადა: ${prettyDate(task.due)}`,'due-tag');meta.append(dateTag);const today=new Date();const todayString=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;if(task.due<todayString&&!task.completed)row.classList.add('overdue');}
      if(task.notes)meta.append(textElement('span',task.notes));info.append(meta);row.append(info);
      const actions=textElement('div','','task-actions');const edit=textElement('button','✎','icon-button');edit.type='button';edit.title='რედაქტირება';edit.setAttribute('aria-label',`რედაქტირება: ${task.title}`);edit.dataset.action='edit';const remove=textElement('button','×','icon-button danger');remove.type='button';remove.title='წაშლა';remove.setAttribute('aria-label',`წაშლა: ${task.title}`);remove.dataset.action='delete';actions.append(edit,remove);row.append(actions);dom.list.append(row);
    }
  }
  function openDialog(task){dom.form.reset();dom.error.hidden=true;dom.id.value=task?.id||'';dom.title.value=task?.title||'';dom.subject.value=task?.subject||'ზოგადი';dom.due.value=task?.due||'';dom.notes.value=task?.notes||'';$('#dialogTitle').textContent=task?'დავალების რედაქტირება':'ახალი დავალება';dom.dialog.showModal();dom.title.focus();}
  function closeDialog(){dom.dialog.close();}
  $('#newTaskButton').addEventListener('click',()=>openDialog());$('#closeDialog').addEventListener('click',closeDialog);$('#cancelDialog').addEventListener('click',closeDialog);
  dom.dialog.addEventListener('click',event=>{if(event.target===dom.dialog)closeDialog();});
  dom.form.addEventListener('submit',event=>{event.preventDefault();const title=dom.title.value.trim();if(!title){dom.error.textContent='შეიყვანე დავალების სათაური.';dom.error.hidden=false;dom.title.focus();return;}if(title.length>90){dom.error.textContent='სათაური არ უნდა აღემატებოდეს 90 სიმბოლოს.';dom.error.hidden=false;return;}const id=dom.id.value;const existing=tasks.find(t=>t.id===id);const entry={id:id||('id-'+Date.now()+'-'+Math.random().toString(36).slice(2,9)),title,subject:dom.subject.value,due:dom.due.value,notes:dom.notes.value.trim(),completed:existing?.completed||false,createdAt:existing?.createdAt||Date.now()};tasks=existing?tasks.map(t=>t.id===id?entry:t):[entry,...tasks];persist();render();closeDialog();notify(existing?'დავალება განახლდა':'ახალი დავალება დაემატა');});
  dom.list.addEventListener('click',event=>{const button=event.target.closest('button[data-action]');if(!button)return;const id=button.closest('[data-id]')?.dataset.id;const task=tasks.find(t=>t.id===id);if(!task)return;if(button.dataset.action==='edit')openDialog(task);else if(button.dataset.action==='delete'&&window.confirm(`წავშალოთ დავალება „${task.title}“?`)){tasks=tasks.filter(t=>t.id!==id);persist();render();notify('დავალება წაიშალა');}});
  dom.list.addEventListener('change',event=>{if(!event.target.matches('input[data-action="toggle"]'))return;const task=tasks.find(t=>t.id===event.target.closest('[data-id]').dataset.id);if(!task)return;task.completed=event.target.checked;persist();render();notify(task.completed?'დავალება შესრულებულია ✓':'დავალება ისევ მიმდინარეა');});
  document.querySelectorAll('[data-filter]').forEach(btn=>btn.addEventListener('click',()=>{filter=btn.dataset.filter;document.querySelectorAll('[data-filter]').forEach(other=>{const isActive=other===btn;other.classList.toggle('active',isActive);other.setAttribute('aria-pressed',String(isActive));});render();}));
  $('#searchInput').addEventListener('input',event=>{search=event.target.value;render();});$('#sortSelect').addEventListener('change',render);
  $('#clearCompleted').addEventListener('click',()=>{const count=tasks.filter(t=>t.completed).length;if(!count)return;if(window.confirm(`წავშალოთ ${count} დასრულებული დავალება?`)){tasks=tasks.filter(t=>!t.completed);persist();render();notify('დასრულებული დავალებები წაიშალა');}});
  const menuToggle=$('#menuToggle'),mainNav=$('#mainNav');menuToggle.addEventListener('click',()=>{const open=mainNav.classList.toggle('open');menuToggle.setAttribute('aria-expanded',String(open));menuToggle.setAttribute('aria-label',open?'მენიუს დახურვა':'მენიუს გახსნა');});mainNav.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>{mainNav.classList.remove('open');menuToggle.setAttribute('aria-expanded','false');}));
  function showTip(){ $('#tipText').textContent=tips[tipIndex];$('#tipCount').textContent=`${String(tipIndex+1).padStart(2,'0')} / ${String(tips.length).padStart(2,'0')}`;}
  $('#prevTip').addEventListener('click',()=>{tipIndex=(tipIndex+tips.length-1)%tips.length;showTip();});$('#nextTip').addEventListener('click',()=>{tipIndex=(tipIndex+1)%tips.length;showTip();});
  render();showTip();
})();

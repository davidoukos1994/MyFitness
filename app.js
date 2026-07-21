const KEY='fitplanner.v1';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const todayISO=()=>new Date().toISOString().slice(0,10);
const uid=()=>Math.random().toString(36).slice(2)+Date.now().toString(36);
const fmtDate=iso=>new Intl.DateTimeFormat('el-GR',{day:'numeric',month:'long',year:'numeric'}).format(new Date(iso+'T12:00:00'));

const starterPrograms=[
 {id:'fullbody-b',title:'Ολόκληρο σώμα — Αρχάριος',place:'gym',level:'beginner',duration:45,goal:'general',exercises:[['Goblet squat',3,10],['Πιέσεις στήθους',3,10],['Κωπηλατική',3,10],['Romanian deadlift',3,10],['Plank',3,30]]},
 {id:'home-20',title:'Σπίτι — 20 λεπτά',place:'home',level:'beginner',duration:20,goal:'fatloss',exercises:[['Καθίσματα',3,12],['Κάμψεις',3,8],['Γέφυρες γλουτών',3,15],['Bird dog',3,10],['Γρήγορο βάδισμα επιτόπου',4,45]]},
 {id:'upper',title:'Άνω σώμα',place:'gym',level:'intermediate',duration:55,goal:'muscle',exercises:[['Πιέσεις πάγκου',4,8],['Κωπηλατική τροχαλίας',4,10],['Πιέσεις ώμων',3,10],['Lat pulldown',3,10],['Κάμψεις δικεφάλων',3,12],['Εκτάσεις τρικεφάλων',3,12]]},
 {id:'lower',title:'Κάτω σώμα',place:'gym',level:'intermediate',duration:55,goal:'strength',exercises:[['Squat',4,6],['Romanian deadlift',4,8],['Leg press',3,10],['Leg curl',3,12],['Γάμπες',4,15]]},
 {id:'mobility',title:'Κινητικότητα και αποκατάσταση',place:'home',level:'beginner',duration:25,goal:'mobility',exercises:[['Cat-cow',2,10],['90/90 ισχίων',2,8],['Thoracic rotation',2,8],['Διάταση καμπτήρων ισχίου',2,40],['Child pose',2,45]]}
];

let state=load();
let calDate=new Date();
let selectedDate=todayISO();
let activeFilter='all';

function defaultState(){
 const id=uid();
 return {activePersonId:id,theme:'light',people:[{id,name:'Αλέξανδρος',birthdate:'',sex:'',height:'',weight:'',waist:'',level:'beginner',place:'gym',days:3,duration:45,goal:'general',limitations:'',measurements:[],calendar:{},customPrograms:[]}]} ;
}
function load(){try{return JSON.parse(localStorage.getItem(KEY))||defaultState()}catch{return defaultState()}}
function save(){localStorage.setItem(KEY,JSON.stringify(state));renderAll()}
function person(){return state.people.find(p=>p.id===state.activePersonId)||state.people[0]}
function ageOf(b){if(!b)return null;const d=new Date(b),n=new Date();let a=n.getFullYear()-d.getFullYear();if(n<new Date(n.getFullYear(),d.getMonth(),d.getDate()))a--;return a}
function toast(t){const el=$('#toast');el.textContent=t;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),1800)}
function go(view){$$('.view').forEach(v=>v.classList.toggle('active',v.dataset.view===view));$$('[data-go]').forEach(b=>b.classList.toggle('active',b.dataset.go===view));if(view==='profile')fillProfile();if(view==='calendar')renderCalendar();window.scrollTo({top:0,behavior:'smooth'})}
$$('[data-go]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.go)));

function renderAll(){
 document.body.classList.toggle('dark',state.theme==='dark');
 const p=person();
 $('#activeName').textContent=p.name;
 $('#activeAvatar').textContent=(p.name||'?')[0].toUpperCase();
 const bits=[]; const age=ageOf(p.birthdate); if(age)bits.push(age+' ετών'); if(p.height)bits.push(p.height+' cm'); if(p.weight)bits.push(p.weight+' kg');
 $('#activeSummary').textContent=bits.join(' • ')||'Δεν έχουν συμπληρωθεί στοιχεία';
 $('#currentWeight').textContent=p.weight?p.weight+' kg':'—';
 const month=todayISO().slice(0,7); const entries=Object.entries(p.calendar||{}).filter(([d])=>d.startsWith(month)).flatMap(([,a])=>a||[]);
 $('#monthWorkouts').textContent=entries.filter(e=>e.done).length;
 $('#streak').textContent=calcStreak(p)+' εβδομ.';
 $('#nextGoal').textContent=goalName(p.goal);
 renderPeople();renderPrograms();renderMeasurements();renderHomeToday();
}
function calcStreak(p){let s=0;for(let w=0;w<12;w++){const end=new Date();end.setDate(end.getDate()-w*7);const start=new Date(end);start.setDate(end.getDate()-6);const has=Object.entries(p.calendar||{}).some(([d,a])=>{const x=new Date(d+'T12:00:00');return x>=start&&x<=end&&(a||[]).some(e=>e.done)});if(has)s++;else if(w>0)break;}return s}
function goalName(g){return ({general:'Ευεξία',fatloss:'Απώλεια λίπους',muscle:'Μυϊκή ανάπτυξη',strength:'Δύναμη',endurance:'Αντοχή',mobility:'Κινητικότητα'})[g]||'Ορισμός'}
function renderHomeToday(){const a=(person().calendar||{})[todayISO()]||[];if(a.length){$('#todayTitle').textContent=a[0].title;$('#todaySubtitle').textContent=a[0].done?'Η προπόνηση ολοκληρώθηκε.':'Έχει προγραμματιστεί για σήμερα.';$('#startTodayBtn').textContent=a[0].done?'Προβολή':'Ξεκίνα προπόνηση'}else{$('#todayTitle').textContent='Η σημερινή προπόνηση';$('#todaySubtitle').textContent='Δημιούργησε πρόγραμμα ή πάρε αυτόματη πρόταση.';$('#startTodayBtn').textContent='Ξεκίνα προπόνηση'}}

function renderPeople(){const g=$('#peopleGrid');g.innerHTML='';state.people.forEach(p=>{const el=document.createElement('article');el.className='person-card card';el.innerHTML=`<div class="person-head"><div class="profile-avatar">${(p.name||'?')[0]}</div><div><h3>${esc(p.name)}</h3><div class="muted small">${[ageOf(p.birthdate)?ageOf(p.birthdate)+' ετών':'',p.weight?p.weight+' kg':''].filter(Boolean).join(' • ')||'Χωρίς στοιχεία'}</div></div></div><div class="actions"><button class="primary select-person">${p.id===state.activePersonId?'Ενεργό':'Επιλογή'}</button><button class="secondary edit-person">Επεξεργασία</button>${state.people.length>1?'<button class="danger delete-person">×</button>':''}</div>`;
 el.querySelector('.select-person').onclick=()=>{state.activePersonId=p.id;save();toast('Επιλέχθηκε το προφίλ')};
 el.querySelector('.edit-person').onclick=()=>{state.activePersonId=p.id;save();go('profile')};
 el.querySelector('.delete-person')?.addEventListener('click',()=>{if(confirm('Να διαγραφεί το προφίλ και όλο το ιστορικό του;')){state.people=state.people.filter(x=>x.id!==p.id);if(state.activePersonId===p.id)state.activePersonId=state.people[0].id;save()}});
 g.appendChild(el)});
}
$('#addPersonBtn').onclick=()=>openPersonModal();
function openPersonModal(){openModal(`<h2>Νέο άτομο</h2><label>Όνομα<input id="newPersonName" required autofocus></label><div class="modal-actions"><button value="cancel" class="secondary">Ακύρωση</button><button value="default" class="primary" id="createPerson">Δημιουργία</button></div>`);$('#createPerson').onclick=e=>{e.preventDefault();const name=$('#newPersonName').value.trim();if(!name)return;const p={...defaultState().people[0],id:uid(),name,calendar:{},measurements:[],customPrograms:[]};state.people.push(p);state.activePersonId=p.id;closeModal();save();go('profile')}}

function fillProfile(){const p=person(),f=$('#profileForm');Object.keys(p).forEach(k=>{if(f.elements[k])f.elements[k].value=p[k]??''})}
$('#saveProfileBtn').onclick=()=>{const f=new FormData($('#profileForm')),p=person();for(const [k,v] of f.entries())p[k]=v;p.days=Number(p.days||3);p.duration=Number(p.duration||45);save();toast('Το προφίλ αποθηκεύτηκε')};

function bmiData(p){if(!p.height||!p.weight)return null;const h=Number(p.height)/100,b=Number(p.weight)/(h*h);let label=b<18.5?'Χαμηλότερο από το συνήθως ενδεικτικό εύρος':b<25?'Μέσα στο συνήθως ενδεικτικό εύρος':b<30?'Πάνω από το συνήθως ενδεικτικό εύρος':'Σημαντικά πάνω από το ενδεικτικό εύρος';return {b,low:18.5*h*h,high:24.9*h*h,label}}
function renderMeasurements(){const p=person(),b=bmiData(p);$('#bmiValue').textContent=b?b.b.toFixed(1):'—';$('#bmiLabel').textContent=b?b.label:'Συμπλήρωσε ύψος και βάρος';$('#weightRange').textContent=b?`${b.low.toFixed(1)}–${b.high.toFixed(1)} kg`:'—';if(p.height&&p.waist){const r=Number(p.waist)/Number(p.height);$('#whrValue').textContent=r.toFixed(2);$('#whrLabel').textContent=r<.5?'Κάτω από το 0,50':'Στο 0,50 ή υψηλότερα'}else{$('#whrValue').textContent='—';$('#whrLabel').textContent='Πρόσθεσε περίμετρο μέσης'}const h=$('#measurementHistory');h.innerHTML='';const list=[...(p.measurements||[])].sort((a,b)=>b.date.localeCompare(a.date));if(!list.length)h.innerHTML='<p class="muted">Δεν υπάρχουν καταχωρίσεις.</p>';list.forEach(m=>{const e=document.createElement('div');e.className='entry';e.innerHTML=`<div class="grow"><b>${fmtDate(m.date)}</b><span class="muted small">${m.weight?m.weight+' kg':''}${m.waist?' • Μέση '+m.waist+' cm':''}${m.chest?' • Στήθος '+m.chest+' cm':''}</span></div><button class="danger">×</button>`;e.querySelector('button').onclick=()=>{p.measurements=p.measurements.filter(x=>x.id!==m.id);save()};h.appendChild(e)})}
$('#addMeasurementBtn').onclick=()=>{openModal(`<h2>Νέα μέτρηση</h2><div class="form-grid"><label>Ημερομηνία<input id="mDate" type="date" value="${todayISO()}"></label><label>Βάρος (kg)<input id="mWeight" type="number" step="0.1" value="${person().weight||''}"></label><label>Μέση (cm)<input id="mWaist" type="number" step="0.1" value="${person().waist||''}"></label><label>Στήθος (cm)<input id="mChest" type="number" step="0.1"></label><label>Μπράτσο (cm)<input id="mArm" type="number" step="0.1"></label><label>Μηρός (cm)<input id="mThigh" type="number" step="0.1"></label></div><div class="modal-actions"><button value="cancel" class="secondary">Ακύρωση</button><button class="primary" id="saveMeasurement">Αποθήκευση</button></div>`);$('#saveMeasurement').onclick=e=>{e.preventDefault();const p=person(),m={id:uid(),date:$('#mDate').value,weight:$('#mWeight').value,waist:$('#mWaist').value,chest:$('#mChest').value,arm:$('#mArm').value,thigh:$('#mThigh').value};p.measurements.push(m);if(m.weight)p.weight=m.weight;if(m.waist)p.waist=m.waist;closeModal();save();toast('Η μέτρηση αποθηκεύτηκε')}};

function allPrograms(){return [...starterPrograms,...(person().customPrograms||[])]}
function renderPrograms(){const g=$('#programGrid');g.innerHTML='';allPrograms().filter(p=>activeFilter==='all'||p.place===activeFilter||p.level===activeFilter).forEach(p=>{const el=document.createElement('article');el.className='program-card card';el.innerHTML=`<span class="tag">${p.place==='home'?'Σπίτι':'Γυμναστήριο'}</span><span class="tag">${p.duration}′</span><h3>${esc(p.title)}</h3><ul>${p.exercises.slice(0,5).map(x=>`<li>${esc(x[0])} — ${x[1]} × ${x[2]}</li>`).join('')}</ul><div class="actions"><button class="primary use-program">Προγραμματισμός</button><button class="secondary view-program">Προβολή</button></div>`;el.querySelector('.use-program').onclick=()=>scheduleProgram(p);el.querySelector('.view-program').onclick=()=>viewProgram(p);g.appendChild(el)})}
$$('.chip').forEach(c=>c.onclick=()=>{$$('.chip').forEach(x=>x.classList.remove('active'));c.classList.add('active');activeFilter=c.dataset.filter;renderPrograms()});
function viewProgram(p){openModal(`<h2>${esc(p.title)}</h2><p class="muted">${p.duration} λεπτά • ${p.place==='home'?'Σπίτι':'Γυμναστήριο'}</p><div class="stack">${p.exercises.map(x=>`<div class="entry"><div class="grow"><b>${esc(x[0])}</b><span class="muted small">${x[1]} σετ × ${x[2]} ${Number(x[2])>20?'δευτ.':'επαν.'}</span></div></div>`).join('')}</div><div class="modal-actions"><button value="cancel" class="secondary">Κλείσιμο</button><button class="primary" id="scheduleFromView">Προγραμματισμός</button></div>`);$('#scheduleFromView').onclick=e=>{e.preventDefault();closeModal();scheduleProgram(p)}}
function scheduleProgram(p,date=selectedDate){openModal(`<h2>Προγραμματισμός</h2><label>Ημερομηνία<input id="scheduleDate" type="date" value="${date||todayISO()}"></label><div class="modal-actions"><button value="cancel" class="secondary">Ακύρωση</button><button class="primary" id="confirmSchedule">Αποθήκευση</button></div>`);$('#confirmSchedule').onclick=e=>{e.preventDefault();const d=$('#scheduleDate').value,per=person();per.calendar[d]=per.calendar[d]||[];per.calendar[d].push({id:uid(),programId:p.id,title:p.title,done:false,exercises:p.exercises.map(x=>[...x])});closeModal();save();selectedDate=d;toast('Μπήκε στο ημερολόγιο')}}
$('#newProgramBtn').onclick=()=>openProgramBuilder();
function openProgramBuilder(){openModal(`<h2>Νέο πρόγραμμα</h2><label>Όνομα<input id="progTitle"></label><div class="form-grid"><label>Χώρος<select id="progPlace"><option value="gym">Γυμναστήριο</option><option value="home">Σπίτι</option></select></label><label>Διάρκεια<input id="progDuration" type="number" value="45"></label></div><h3>Ασκήσεις</h3><div id="exerciseBuilder"></div><button type="button" class="secondary" id="addExercise">+ Άσκηση</button><div class="modal-actions"><button value="cancel" class="secondary">Ακύρωση</button><button class="primary" id="saveProgram">Αποθήκευση</button></div>`);const add=()=>{const r=document.createElement('div');r.className='exercise-row';r.innerHTML='<input placeholder="Άσκηση"><input type="number" value="3" min="1"><input type="number" value="10" min="1"><button type="button" class="danger">×</button>';r.querySelector('button').onclick=()=>r.remove();$('#exerciseBuilder').appendChild(r)};add();add();add();$('#addExercise').onclick=add;$('#saveProgram').onclick=e=>{e.preventDefault();const exercises=$$('#exerciseBuilder .exercise-row').map(r=>{const i=r.querySelectorAll('input');return[i[0].value.trim(),Number(i[1].value),Number(i[2].value)]}).filter(x=>x[0]);if(!$('#progTitle').value.trim()||!exercises.length)return;person().customPrograms.push({id:uid(),title:$('#progTitle').value.trim(),place:$('#progPlace').value,level:person().level,duration:Number($('#progDuration').value),goal:person().goal,exercises});closeModal();save();toast('Το πρόγραμμα δημιουργήθηκε')}}

function suggestProgram(){const p=person();let candidates=starterPrograms.filter(x=>(p.place==='both'||x.place===p.place)&&(x.level===p.level||p.level==='advanced'));if(!candidates.length)candidates=starterPrograms;let pick=candidates.find(x=>x.goal===p.goal)||candidates[0];viewProgram(pick)}
$('#suggestBtn').onclick=suggestProgram;$('#startTodayBtn').onclick=()=>{const a=(person().calendar||{})[todayISO()]||[];if(a.length)openWorkout(a[0],todayISO());else suggestProgram()};

function renderCalendar(){const y=calDate.getFullYear(),m=calDate.getMonth();$('#calendarMonth').textContent=new Intl.DateTimeFormat('el-GR',{month:'long',year:'numeric'}).format(calDate);const first=new Date(y,m,1),offset=(first.getDay()+6)%7,days=new Date(y,m+1,0).getDate(),prevDays=new Date(y,m,0).getDate(),g=$('#calendarGrid');g.innerHTML='';for(let i=0;i<42;i++){let d,mon=m,yr=y,out=false;if(i<offset){d=prevDays-offset+i+1;mon=m-1;out=true}else if(i>=offset+days){d=i-offset-days+1;mon=m+1;out=true}else d=i-offset+1;const dt=new Date(yr,mon,d),iso=[dt.getFullYear(),String(dt.getMonth()+1).padStart(2,'0'),String(dt.getDate()).padStart(2,'0')].join('-');const b=document.createElement('button');b.className='day'+(out?' out':'')+(iso===todayISO()?' today':'')+(iso===selectedDate?' selected':'');b.innerHTML=`<span>${d}</span>${(person().calendar[iso]||[]).length?'<i class="dot"></i>':''}`;b.onclick=()=>{selectedDate=iso;renderCalendar()};g.appendChild(b)}renderDayPanel()}
function renderDayPanel(){ $('#selectedDateTitle').textContent=fmtDate(selectedDate);const a=person().calendar[selectedDate]||[],g=$('#dayEntries');g.innerHTML='';if(!a.length)g.innerHTML='<p class="muted">Δεν υπάρχει προγραμματισμένη προπόνηση.</p>';a.forEach(e=>{const row=document.createElement('div');row.className='entry'+(e.done?' done':'');row.innerHTML=`<div class="grow"><b>${esc(e.title)}</b><span class="muted small">${e.done?'Ολοκληρώθηκε':'Προγραμματισμένη'}</span></div><button class="primary">${e.done?'Προβολή':'Έναρξη'}</button><button class="danger">×</button>`;row.querySelector('.primary').onclick=()=>openWorkout(e,selectedDate);row.querySelector('.danger').onclick=()=>{person().calendar[selectedDate]=a.filter(x=>x.id!==e.id);save();renderCalendar()};g.appendChild(row)})}
$('#prevMonth').onclick=()=>{calDate.setMonth(calDate.getMonth()-1);renderCalendar()};$('#nextMonth').onclick=()=>{calDate.setMonth(calDate.getMonth()+1);renderCalendar()};$('#calendarTodayBtn').onclick=()=>{calDate=new Date();selectedDate=todayISO();renderCalendar()};$('#addDayWorkoutBtn').onclick=()=>{go('programs')};
function openWorkout(entry,date){openModal(`<h2>${esc(entry.title)}</h2><p class="muted">${fmtDate(date)}</p><div class="stack">${entry.exercises.map((x,i)=>`<label class="entry"><input type="checkbox" class="set-check" data-i="${i}" ${entry.done?'checked':''} style="width:auto;margin:0"><div class="grow"><b>${esc(x[0])}</b><span class="muted small">${x[1]} × ${x[2]}</span></div></label>`).join('')}</div><div class="modal-actions"><button value="cancel" class="secondary">Κλείσιμο</button><button class="primary" id="finishWorkout">Ολοκλήρωση</button></div>`);$('#finishWorkout').onclick=e=>{e.preventDefault();entry.done=true;entry.completedAt=new Date().toISOString();closeModal();save();renderCalendar();toast('Μπράβο! Η προπόνηση ολοκληρώθηκε')}}

$('#themeBtn').onclick=()=>{state.theme=state.theme==='dark'?'light':'dark';save()};
$('#exportBtn').onclick=()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='fitplanner-backup-'+todayISO()+'.json';a.click();URL.revokeObjectURL(a.href)};
$('#importInput').onchange=async e=>{try{const data=JSON.parse(await e.target.files[0].text());if(!data.people?.length)throw 0;state=data;save();toast('Το backup εισήχθη')}catch{alert('Το αρχείο backup δεν είναι έγκυρο')}};
function openModal(html){$('#modalContent').innerHTML=html;$('#modal').showModal()}
function closeModal(){$('#modal').close()}
function esc(s=''){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}

if('serviceWorker' in navigator)navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
renderAll();renderCalendar();

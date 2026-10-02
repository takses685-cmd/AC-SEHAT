const KEY='ac_sehat_v1';
let data=JSON.parse(localStorage.getItem(KEY)||'{"customers":[],"jobs":[],"technicians":[]}');
let deferredPrompt=null;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;document.getElementById('installBtn').classList.remove('hidden')});
document.getElementById('installBtn').onclick=async()=>{if(deferredPrompt){deferredPrompt.prompt();deferredPrompt=null}};
function save(){localStorage.setItem(KEY,JSON.stringify(data));refresh()}
function rupiah(n){return new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(n)||0)}
function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function showPage(id){document.querySelectorAll('.page').forEach(x=>x.classList.remove('active'));document.getElementById(id).classList.add('active');document.querySelectorAll('nav button').forEach(x=>x.classList.toggle('active',x.dataset.page===id));refresh()}
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>showPage(b.dataset.page));
function refresh(){renderDash();renderJobs();renderCustomers();renderReport()}
function renderDash(){document.getElementById('totalJobs').textContent=data.jobs.length;document.getElementById('openJobs').textContent=data.jobs.filter(j=>j.status!=='Selesai').length;document.getElementById('doneJobs').textContent=data.jobs.filter(j=>j.status==='Selesai').length;document.getElementById('income').textContent=rupiah(data.jobs.reduce((a,j)=>a+Number(j.cost||0),0))}
function renderJobs(){
 let q=(document.getElementById('jobSearch')?.value||'').toLowerCase();
 let arr=data.jobs.filter(j=>(j.customer+' '+j.address+' '+j.tech).toLowerCase().includes(q)).sort((a,b)=>b.created.localeCompare(a.created));
 let el=document.getElementById('jobList'); if(!arr.length){el.innerHTML='<div class="empty">Belum ada pekerjaan service.</div>';return}
 el.innerHTML=arr.map(j=>`<div class="item"><h3>${esc(j.customer)}</h3><p>📅 ${esc(j.date)} &nbsp; 📍 ${esc(j.address)}</p><p>🔧 ${esc(j.type)} &nbsp; 👨‍🔧 ${esc(j.tech||'-')}</p><p>💰 ${rupiah(j.cost)} &nbsp; <span class="badge ${j.status==='Selesai'?'done':''}">${esc(j.status)}</span></p>${(j.before||j.after)?'<div class="thumbs">'+(j.before?`<img src="${j.before}">`:'')+(j.after?`<img src="${j.after}">`:'')+'</div>':''}<div class="actions"><button onclick="openJob('${j.id}')">Edit</button>${j.status!=='Selesai'?`<button class="success" onclick="finishJob('${j.id}')">Selesaikan</button>`:''}<button class="danger" onclick="deleteJob('${j.id}')">Hapus</button></div></div>`).join('')
}
document.getElementById('jobSearch').oninput=renderJobs;
function renderCustomers(){let el=document.getElementById('customerList');if(!data.customers.length){el.innerHTML='<div class="empty">Belum ada pelanggan.</div>';return}el.innerHTML=data.customers.map(c=>`<div class="item"><h3>${esc(c.name)}</h3><p>📞 ${esc(c.phone||'-')}</p><p>📍 ${esc(c.address||'-')}</p><div class="actions"><button onclick="openCustomer('${c.id}')">Edit</button><button class="danger" onclick="deleteCustomer('${c.id}')">Hapus</button></div></div>`).join('')}
function openCustomer(id){
 let c=data.customers.find(x=>x.id===id)||{name:'',phone:'',address:''};
 document.getElementById('modalContent').innerHTML=`<h2>${id?'Edit':'Pelanggan Baru'}</h2><label>Nama<input id="cname" value="${esc(c.name)}"></label><label>No. HP<input id="cphone" value="${esc(c.phone)}"></label><label>Alamat<textarea id="caddress">${esc(c.address)}</textarea></label><button onclick="saveCustomer('${id||''}')">Simpan</button>`;
 openModal()
}
function saveCustomer(id){let obj={id:id||Date.now().toString(),name:cname.value.trim(),phone:cphone.value.trim(),address:caddress.value.trim()};if(!obj.name)return alert('Nama pelanggan wajib diisi');let i=data.customers.findIndex(x=>x.id===obj.id);if(i>=0)data.customers[i]=obj;else data.customers.push(obj);closeModal();save()}
function deleteCustomer(id){if(confirm('Hapus pelanggan ini?')){data.customers=data.customers.filter(x=>x.id!==id);save()}}
function openJob(id){
 let j=data.jobs.find(x=>x.id===id)||{customer:'',date:new Date().toISOString().slice(0,10),address:'',type:'Cuci AC',tech:'',cost:0,status:'Menunggu',notes:'',before:'',after:''};
 let opts=data.customers.map(c=>`<option ${c.name===j.customer?'selected':''}>${esc(c.name)}</option>`).join('');
 document.getElementById('modalContent').innerHTML=`<h2>${id?'Edit':'Service Baru'}</h2>
 <label>Pelanggan<select id="jcustomer"><option value="">-- pilih / ketik manual di bawah --</option>${opts}</select></label>
 <label>Nama Pelanggan<input id="jcustomer2" value="${esc(j.customer)}" placeholder="Nama pelanggan"></label>
 <div class="row"><label>Tanggal<input type="date" id="jdate" value="${j.date}"></label><label>Teknisi<input id="jtech" value="${esc(j.tech)}"></label></div>
 <label>Alamat<textarea id="jaddress">${esc(j.address)}</textarea></label>
 <label>Jenis Pekerjaan<select id="jtype">${['Cuci AC','Service AC','Bongkar/Pasang','Isi Freon','Perbaikan','Lainnya'].map(x=>`<option ${x===j.type?'selected':''}>${x}</option>`).join('')}</select></label>
 <div class="row"><label>Biaya (Rp)<input type="number" id="jcost" value="${Number(j.cost)||0}"></label><label>Status<select id="jstatus">${['Menunggu','Diproses','Selesai'].map(x=>`<option ${x===j.status?'selected':''}>${x}</option>`).join('')}</select></label></div>
 <label>Catatan<textarea id="jnotes">${esc(j.notes)}</textarea></label>
 <label>Foto Sebelum<input type="file" id="jbefore" accept="image/*" capture="environment"></label>
 <label>Foto Sesudah<input type="file" id="jafter" accept="image/*" capture="environment"></label>
 <button onclick="saveJob('${id||''}')">Simpan Pekerjaan</button>`;
 jcustomer.onchange=()=>{jcustomer2.value=jcustomer.value;let c=data.customers.find(x=>x.name===jcustomer.value);if(c)jaddress.value=c.address};
 openModal()
}
function readFile(input){return new Promise(r=>{let f=input.files[0];if(!f)return r('');let rd=new FileReader();rd.onload=()=>r(rd.result);rd.readAsDataURL(f)})}
async function saveJob(id){
 let old=data.jobs.find(x=>x.id===id)||{};let before=await readFile(jbefore),after=await readFile(jafter);
 let obj={...old,id:id||Date.now().toString(),customer:jcustomer2.value.trim(),date:jdate.value,address:jaddress.value.trim(),type:jtype.value,tech:jtech.value.trim(),cost:Number(jcost.value)||0,status:jstatus.value,notes:jnotes.value.trim(),before:before||old.before||'',after:after||old.after||'',created:old.created||new Date().toISOString()};
 if(!obj.customer)return alert('Nama pelanggan wajib diisi');data.jobs=data.jobs.filter(x=>x.id!==obj.id);data.jobs.push(obj);closeModal();save()
}
function finishJob(id){let j=data.jobs.find(x=>x.id===id);if(j){j.status='Selesai';save()}}
function deleteJob(id){if(confirm('Hapus pekerjaan ini?')){data.jobs=data.jobs.filter(x=>x.id!==id);save()}}
function renderReport(){
 let from=document.getElementById('from').value,to=document.getElementById('to').value;
 let arr=data.jobs.filter(j=>(!from||j.date>=from)&&(!to||j.date<=to));let total=arr.reduce((a,j)=>a+Number(j.cost||0),0);
 document.getElementById('reportResult').innerHTML=`<div class="panel"><h3>Ringkasan</h3><p>Total pekerjaan: <b>${arr.length}</b></p><p>Selesai: <b>${arr.filter(j=>j.status==='Selesai').length}</b></p><p>Pendapatan: <b>${rupiah(total)}</b></p></div>`+arr.map(j=>`<div class="item"><b>${esc(j.date)} - ${esc(j.customer)}</b><p>${esc(j.type)} | ${esc(j.status)} | ${rupiah(j.cost)}</p></div>`).join('')
}
function printReport(){window.print()}
function openModal(){document.getElementById('modal').classList.remove('hidden')}
function closeModal(){document.getElementById('modal').classList.add('hidden')}
refresh();

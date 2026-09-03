const STORE_KEY = 'inventrack_mca_v1';
const LEGACY_STORE_KEY = 'stockflow_inventory_v1';
const rupees = new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0});
const shortDate = new Intl.DateTimeFormat('en-IN',{day:'2-digit',month:'short',year:'numeric'});

const seed = {
  suppliers:[
    {id:'s1',name:'Nova Tech Distributors',contact:'Arjun Mehta',phone:'+91 98765 43210',email:'orders@novatech.example',address:'Bengaluru, Karnataka'},
    {id:'s2',name:'GreenLeaf Wholesale',contact:'Priya Nair',phone:'+91 98220 11223',email:'sales@greenleaf.example',address:'Kochi, Kerala'},
    {id:'s3',name:'Metro Office Supplies',contact:'Rohan Shah',phone:'+91 97654 32109',email:'hello@metrooffice.example',address:'Mumbai, Maharashtra'}
  ],
  products:[
    {id:'p1',name:'Wireless Keyboard',sku:'ELEC-001',category:'Electronics',quantity:28,reorder:10,cost:1250,price:1899,supplierId:'s1'},
    {id:'p2',name:'USB-C Hub 7-in-1',sku:'ELEC-014',category:'Electronics',quantity:7,reorder:8,cost:1750,price:2499,supplierId:'s1'},
    {id:'p3',name:'A4 Premium Paper',sku:'STAT-021',category:'Stationery',quantity:64,reorder:15,cost:245,price:349,supplierId:'s3'},
    {id:'p4',name:'Ergonomic Office Chair',sku:'FURN-005',category:'Furniture',quantity:4,reorder:5,cost:7200,price:9999,supplierId:'s3'},
    {id:'p5',name:'Organic Green Tea',sku:'PAN-032',category:'Pantry',quantity:42,reorder:12,cost:180,price:275,supplierId:'s2'},
    {id:'p6',name:'Desk Organizer',sku:'STAT-044',category:'Stationery',quantity:0,reorder:6,cost:320,price:499,supplierId:'s3'}
  ],
  movements:[
    {id:'m1',productId:'p1',type:'in',quantity:20,balance:28,reference:'PO-1042',notes:'Monthly replenishment',date:'2026-08-20T09:30:00'},
    {id:'m2',productId:'p3',type:'out',quantity:6,balance:64,reference:'SALE-218',notes:'Customer order',date:'2026-08-19T14:10:00'},
    {id:'m3',productId:'p4',type:'out',quantity:2,balance:4,reference:'SALE-215',notes:'Corporate order',date:'2026-08-18T11:20:00'},
    {id:'m4',productId:'p5',type:'in',quantity:24,balance:42,reference:'PO-1039',notes:'Supplier delivery',date:'2026-08-17T16:00:00'}
  ]
};

let db = load();
const $ = id => document.getElementById(id);
const uid = prefix => prefix + Date.now().toString(36) + Math.random().toString(36).slice(2,6);
const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

function load(){
  try{
    const current=localStorage.getItem(STORE_KEY),saved=JSON.parse(current||localStorage.getItem(LEGACY_STORE_KEY));
    if(saved?.products&&saved?.suppliers&&saved?.movements){if(!current)localStorage.setItem(STORE_KEY,JSON.stringify(saved));return saved}
  }catch{}
  localStorage.setItem(STORE_KEY,JSON.stringify(seed));return structuredClone(seed);
}
function save(){localStorage.setItem(STORE_KEY,JSON.stringify(db));renderAll();}
function toast(message){const el=$('toast');el.textContent=message;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),2400)}
function initials(name){return name.split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase()}
function productFor(id){return db.products.find(p=>p.id===id)}
function statusFor(p){return p.quantity===0?['Out of stock','out']:p.quantity<=p.reorder?['Low stock','low']:['In stock','good']}
function parseCsv(text){
  const rows=[];let row=[],field='',quote=false;
  for(let i=0;i<text.length;i++){
    const char=text[i],next=text[i+1];
    if(quote&&char==='"'&&next==='"'){field+='"';i++}
    else if(char==='"')quote=!quote;
    else if(char===','&&!quote){row.push(field);field=''}
    else if((char==='\n'||char==='\r')&&!quote){if(char==='\r'&&next==='\n')i++;row.push(field);if(row.some(cell=>cell.trim()))rows.push(row);row=[];field=''}
    else field+=char;
  }
  row.push(field);if(row.some(cell=>cell.trim()))rows.push(row);
  return rows;
}
function importProductsFromCsv(text){
  const rows=parseCsv(text),headers=rows.shift()?.map(h=>h.trim().toLowerCase())||[],required=['name','sku','category','quantity','reorder level','cost price','selling price'];
  const missing=required.filter(name=>!headers.includes(name));
  if(missing.length)throw new Error(`Missing columns: ${missing.join(', ')}`);
  const index=name=>headers.indexOf(name),seen=new Set();
  const products=rows.map((row,line)=>{const number=(name)=>Number(row[index(name)]||0),sku=(row[index('sku')]||'').trim(),name=(row[index('name')]||'').trim(),category=(row[index('category')]||'').trim();if(!name||!sku||!category)throw new Error(`Row ${line+2} needs name, SKU, and category.`);if(seen.has(sku.toLowerCase()))throw new Error(`Duplicate SKU in CSV: ${sku}`);seen.add(sku.toLowerCase());const quantity=number('quantity'),reorder=number('reorder level'),cost=number('cost price'),price=number('selling price');if([quantity,reorder,cost,price].some(n=>Number.isNaN(n)||n<0))throw new Error(`Row ${line+2} has invalid numeric values.`);return {id:uid('p'),name,sku,category,quantity,reorder,cost,price,supplierId:''}});
  if(!products.length)throw new Error('No product rows found.');
  db.products=products;
  db.movements=products.filter(p=>p.quantity>0).map(p=>({id:uid('m'),productId:p.id,type:'in',quantity:p.quantity,balance:p.quantity,reference:'CSV IMPORT',notes:'Imported opening stock',date:new Date().toISOString()}));
  save();
  toast(`Imported ${products.length} products.`);
}

const viewMeta={dashboard:['Dashboard','A clear view of your inventory today.'],products:['Products','Manage your product catalogue and stock levels.'],reorder:['Reorder Plan','Prioritize purchases before stock runs out.'],movements:['Stock Movements','Track every addition, sale, and adjustment.'],suppliers:['Suppliers','Manage the businesses that supply your stock.'],about:['About Project','An MCA academic project built with core web technologies.']};
function showView(name){
  document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id===`${name}View`));
  document.querySelectorAll('.nav-link').forEach(n=>n.classList.toggle('active',n.dataset.view===name));
  $('pageTitle').textContent=viewMeta[name][0];$('pageSubtitle').textContent=viewMeta[name][1];
  $('sidebar').classList.remove('open');location.hash=name;
}

function renderDashboard(){
  const units=db.products.reduce((n,p)=>n+p.quantity,0),low=db.products.filter(p=>p.quantity<=p.reorder),value=db.products.reduce((n,p)=>n+p.quantity*p.cost,0),margin=db.products.reduce((n,p)=>n+p.quantity*(p.price-p.cost),0),cats=[...new Set(db.products.map(p=>p.category))];
  $('metricProducts').textContent=db.products.length;$('metricCategories').textContent=`${cats.length} ${cats.length===1?'category':'categories'}`;$('metricUnits').textContent=units.toLocaleString('en-IN');$('metricLow').textContent=low.length;$('metricValue').textContent=rupees.format(value);$('metricMargin').textContent=rupees.format(margin);
  const healthy=db.products.length-low.length,reorderBudget=low.reduce((n,p)=>n+suggestedReorderQty(p)*p.cost,0),supplierCounts=db.suppliers.map(s=>[s.name,db.products.filter(p=>p.supplierId===s.id).length]).sort((a,b)=>b[1]-a[1]);
  $('stockHealth').textContent=db.products.length?`${Math.round(healthy/db.products.length*100)}%`:'0%';$('reorderBudget').textContent=rupees.format(reorderBudget);$('topSupplier').textContent=supplierCounts[0]?.[1]?supplierCounts[0][0]:'--';
  const totals=Object.entries(db.products.reduce((a,p)=>{a[p.category]=(a[p.category]||0)+p.quantity;return a},{})).sort((a,b)=>b[1]-a[1]);const max=Math.max(1,...totals.map(x=>x[1]));
  $('categoryChart').innerHTML=totals.length?totals.map(([cat,n])=>`<div class="bar-row"><label title="${escapeHtml(cat)}">${escapeHtml(cat)}</label><div class="bar-track"><div class="bar-fill" style="width:${Math.max(3,n/max*100)}%"></div></div><strong>${n}</strong></div>`).join(''):'<div class="empty">Add products to see category stock.</div>';
  $('lowStockList').innerHTML=low.length?low.slice(0,5).map(p=>`<div class="alert-item"><div><strong>${escapeHtml(p.name)}</strong><small>${escapeHtml(p.sku)} - Reorder at ${p.reorder}</small></div><strong class="stock-number">${p.quantity} left</strong></div>`).join(''):'<div class="empty">Everything is well stocked.</div>';
  const recent=[...db.movements].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,5);
  $('recentTable').innerHTML=recent.length?recent.map(m=>movementRow(m,false)).join(''):'<tr><td colspan="5" class="empty">No stock activity yet.</td></tr>';
}

function renderProducts(){
  const search=$('productSearch').value.toLowerCase(),cat=$('categoryFilter').value,stock=$('stockFilter').value;
  const filtered=db.products.filter(p=>{const matches=!search||[p.name,p.sku,p.category].some(x=>x.toLowerCase().includes(search));const state=statusFor(p)[1];return matches&&(!cat||p.category===cat)&&(!stock||state===stock||(stock==='healthy'&&state==='good'))});
  $('productsTable').innerHTML=filtered.length?filtered.map(p=>{const status=statusFor(p),supplier=db.suppliers.find(s=>s.id===p.supplierId)?.name||'--',margin=(p.price-p.cost)*p.quantity;return `<tr><td><div class="product-cell"><span class="product-avatar">${initials(p.name)}</span><strong>${escapeHtml(p.name)}</strong></div></td><td>${escapeHtml(p.sku)}</td><td>${escapeHtml(p.category)}</td><td><strong>${p.quantity}</strong> units</td><td>${rupees.format(p.cost)}</td><td>${rupees.format(p.price)}</td><td>${rupees.format(p.cost*p.quantity)}</td><td>${rupees.format(margin)}</td><td>${escapeHtml(supplier)}</td><td><span class="badge ${status[1]}">${status[0]}</span></td><td><div class="actions"><button class="action-btn" data-edit-product="${p.id}" title="Edit product">Edit</button><button class="action-btn" data-move-product="${p.id}" title="Record stock movement">Stock</button><button class="action-btn" data-delete-product="${p.id}" title="Delete product">Delete</button></div></td></tr>`}).join(''):'<tr><td colspan="11" class="empty">No products match these filters.</td></tr>';
  $('productCount').textContent=`Showing ${filtered.length} of ${db.products.length} products`;
  const selected=$('categoryFilter').value,categories=[...new Set(db.products.map(p=>p.category))].sort();$('categoryFilter').innerHTML='<option value="">All categories</option>'+categories.map(c=>`<option ${c===selected?'selected':''}>${escapeHtml(c)}</option>`).join('');
}

function suggestedReorderQty(p){return p.quantity<=p.reorder?Math.max(p.reorder*2-p.quantity,p.reorder-p.quantity):0}
function renderReorderPlan(){
  const items=db.products.filter(p=>p.quantity<=p.reorder).sort((a,b)=>a.quantity-b.quantity);
  const units=items.reduce((n,p)=>n+suggestedReorderQty(p),0),cost=items.reduce((n,p)=>n+suggestedReorderQty(p)*p.cost,0);
  $('reorderItems').textContent=items.length;$('reorderUnits').textContent=units.toLocaleString('en-IN');$('reorderCost').textContent=rupees.format(cost);
  $('reorderTable').innerHTML=items.length?items.map(p=>{const qty=suggestedReorderQty(p),supplier=db.suppliers.find(s=>s.id===p.supplierId)?.name||'--',status=statusFor(p);return `<tr><td><div class="product-cell"><span class="product-avatar">${initials(p.name)}</span><strong>${escapeHtml(p.name)}</strong></div></td><td>${p.quantity}</td><td>${p.reorder}</td><td><strong>${qty}</strong> units</td><td>${rupees.format(qty*p.cost)}</td><td>${escapeHtml(supplier)}</td><td><span class="badge ${status[1]}">${status[0]}</span></td></tr>`}).join(''):'<tr><td colspan="7" class="empty">No reorder action is needed right now.</td></tr>';
}

function movementRow(m,full=true){const p=productFor(m.productId),sign=m.type==='out'?'-':m.type==='in'?'+':'=';return `<tr>${full?`<td>${shortDate.format(new Date(m.date))}</td>`:''}<td><strong>${escapeHtml(p?.name||'Deleted product')}</strong></td><td><span class="badge ${m.type}">${m.type==='in'?'Stock in':m.type==='out'?'Stock out':'Adjustment'}</span></td><td class="${m.type==='out'?'qty-negative':'qty-positive'}">${sign}${m.quantity}</td>${full?`<td>${m.balance}</td>`:`<td>${shortDate.format(new Date(m.date))}</td>`}<td>${escapeHtml(m.reference||'--')}</td>${full?`<td>${escapeHtml(m.notes||'--')}</td>`:''}</tr>`}
function renderMovements(){const rows=[...db.movements].sort((a,b)=>new Date(b.date)-new Date(a.date));$('movementsTable').innerHTML=rows.length?rows.map(m=>movementRow(m)).join(''):'<tr><td colspan="7" class="empty">No stock movements recorded.</td></tr>'}

function renderSuppliers(){
  $('supplierGrid').innerHTML=db.suppliers.length?db.suppliers.map(s=>{const count=db.products.filter(p=>p.supplierId===s.id).length;return `<article class="supplier-card"><div class="supplier-card-head"><span class="supplier-logo">${initials(s.name)}</span><div class="actions"><button class="action-btn" data-edit-supplier="${s.id}" title="Edit supplier">Edit</button><button class="action-btn" data-delete-supplier="${s.id}" title="Delete supplier">Delete</button></div></div><h3>${escapeHtml(s.name)}</h3><p class="contact">${escapeHtml(s.contact||'No contact person')}</p><div class="supplier-details"><a href="tel:${escapeHtml(s.phone)}">Phone: ${escapeHtml(s.phone||'No phone')}</a><a href="mailto:${escapeHtml(s.email)}">Email: ${escapeHtml(s.email||'No email')}</a><span>Address: ${escapeHtml(s.address||'No address')}</span></div><div class="supplier-meta">Supplies ${count} ${count===1?'product':'products'}</div></article>`}).join(''):'<div class="panel empty">No suppliers added yet.</div>';
}
function fillSelects(){
  const supplierValue=$('productSupplier').value;$('productSupplier').innerHTML='<option value="">No supplier</option>'+db.suppliers.map(s=>`<option value="${s.id}" ${s.id===supplierValue?'selected':''}>${escapeHtml(s.name)}</option>`).join('');
  const productValue=$('movementProduct').value;$('movementProduct').innerHTML='<option value="">Select a product</option>'+db.products.map(p=>`<option value="${p.id}" ${p.id===productValue?'selected':''}>${escapeHtml(p.name)} (${p.quantity} units)</option>`).join('');
}
function renderAll(){renderDashboard();renderProducts();renderReorderPlan();renderMovements();renderSuppliers();fillSelects()}

function openProduct(id=''){
  const p=productFor(id);$('productForm').reset();$('productId').value=id;$('productDialogTitle').textContent=p?'Edit product':'Add product';
  if(p){$('productName').value=p.name;$('productSku').value=p.sku;$('productCategory').value=p.category;$('productQuantity').value=p.quantity;$('productReorder').value=p.reorder;$('productCost').value=p.cost;$('productPrice').value=p.price;$('productSupplier').value=p.supplierId||''}
  $('productQuantity').disabled=Boolean(p);$('productDialog').showModal();
}
function openMovement(productId=''){$('movementForm').reset();$('movementError').textContent='';fillSelects();$('movementProduct').value=productId;$('movementDialog').showModal()}
function openSupplier(id=''){const s=db.suppliers.find(x=>x.id===id);$('supplierForm').reset();$('supplierId').value=id;$('supplierDialogTitle').textContent=s?'Edit supplier':'Add supplier';if(s){$('supplierName').value=s.name;$('supplierContact').value=s.contact;$('supplierPhone').value=s.phone;$('supplierEmail').value=s.email;$('supplierAddress').value=s.address}$('supplierDialog').showModal()}

$('productForm').addEventListener('submit',e=>{e.preventDefault();const id=$('productId').value,sku=$('productSku').value.trim();if(db.products.some(p=>p.sku.toLowerCase()===sku.toLowerCase()&&p.id!==id)){toast('That SKU is already in use.');return}const old=productFor(id),product={id:id||uid('p'),name:$('productName').value.trim(),sku,category:$('productCategory').value.trim(),quantity:old?.quantity??Number($('productQuantity').value),reorder:Number($('productReorder').value),cost:Number($('productCost').value),price:Number($('productPrice').value),supplierId:$('productSupplier').value};if(old)Object.assign(old,product);else{db.products.unshift(product);if(product.quantity>0)db.movements.unshift({id:uid('m'),productId:product.id,type:'in',quantity:product.quantity,balance:product.quantity,reference:'OPENING',notes:'Opening stock',date:new Date().toISOString()})}save();$('productDialog').close();toast(old?'Product updated.':'Product added.')});
$('movementForm').addEventListener('submit',e=>{e.preventDefault();const p=productFor($('movementProduct').value),type=$('movementType').value,qty=Number($('movementQuantity').value);if(!p){$('movementError').textContent='Choose a product.';return}if(type==='out'&&qty>p.quantity){$('movementError').textContent=`Only ${p.quantity} units are currently available.`;return}if(qty<0){$('movementError').textContent='Quantity cannot be negative.';return}p.quantity=type==='in'?p.quantity+qty:type==='out'?p.quantity-qty:qty;db.movements.unshift({id:uid('m'),productId:p.id,type,quantity:qty,balance:p.quantity,reference:$('movementReference').value.trim(),notes:$('movementNotes').value.trim(),date:new Date().toISOString()});save();$('movementDialog').close();toast('Stock movement recorded.')});
$('supplierForm').addEventListener('submit',e=>{e.preventDefault();const id=$('supplierId').value,old=db.suppliers.find(s=>s.id===id),supplier={id:id||uid('s'),name:$('supplierName').value.trim(),contact:$('supplierContact').value.trim(),phone:$('supplierPhone').value.trim(),email:$('supplierEmail').value.trim(),address:$('supplierAddress').value.trim()};if(old)Object.assign(old,supplier);else db.suppliers.push(supplier);save();$('supplierDialog').close();toast(old?'Supplier updated.':'Supplier added.')});

document.addEventListener('click',e=>{
  const close=e.target.closest('[data-close-dialog]');if(close)close.closest('dialog').close();
  const nav=e.target.closest('[data-view]'),go=e.target.closest('[data-go]');if(nav)showView(nav.dataset.view);if(go)showView(go.dataset.go);
  const editP=e.target.closest('[data-edit-product]'),moveP=e.target.closest('[data-move-product]'),deleteP=e.target.closest('[data-delete-product]'),editS=e.target.closest('[data-edit-supplier]'),deleteS=e.target.closest('[data-delete-supplier]');
  if(editP)openProduct(editP.dataset.editProduct);if(moveP)openMovement(moveP.dataset.moveProduct);
  if(deleteP){const id=deleteP.dataset.deleteProduct,p=productFor(id);if(confirm(`Delete ${p.name}? Its movement history will remain.`)){db.products=db.products.filter(x=>x.id!==id);save();toast('Product deleted.')}}
  if(editS)openSupplier(editS.dataset.editSupplier);if(deleteS){const id=deleteS.dataset.deleteSupplier,s=db.suppliers.find(x=>x.id===id);if(confirm(`Delete supplier ${s.name}?`)){db.suppliers=db.suppliers.filter(x=>x.id!==id);db.products.forEach(p=>{if(p.supplierId===id)p.supplierId=''});save();toast('Supplier deleted.')}}
});
$('quickAddBtn').onclick=$('addProductBtn').onclick=()=>openProduct();$('addMovementBtn').onclick=()=>openMovement();$('addSupplierBtn').onclick=()=>openSupplier();$('menuBtn').onclick=()=>$('sidebar').classList.toggle('open');$('productSearch').oninput=renderProducts;$('categoryFilter').onchange=renderProducts;$('stockFilter').onchange=renderProducts;
$('resetDataBtn').onclick=()=>{if(confirm('Reset all records to the original demo data?')){db=structuredClone(seed);save();toast('Demo data restored.')}};
$('exportBtn').onclick=()=>{const headers=['Name','SKU','Category','Quantity','Reorder Level','Cost Price','Selling Price','Inventory Value','Gross Margin','Supplier','Status'];const rows=db.products.map(p=>[p.name,p.sku,p.category,p.quantity,p.reorder,p.cost,p.price,p.quantity*p.cost,p.quantity*(p.price-p.cost),db.suppliers.find(s=>s.id===p.supplierId)?.name||'',statusFor(p)[0]]);const csv=[headers,...rows].map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(',')).join('\r\n');const blob=new Blob([csv],{type:'text/csv'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`inventrack-inventory-${new Date().toISOString().slice(0,10)}.csv`;a.click();URL.revokeObjectURL(url);toast('Inventory exported.')};
$('importBtn').onclick=()=>$('importFile').click();
$('importFile').onchange=e=>{const file=e.target.files[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{try{importProductsFromCsv(reader.result)}catch(error){toast(error.message)}finally{e.target.value=''}};reader.readAsText(file)};
window.addEventListener('hashchange',()=>{const v=location.hash.slice(1);if(viewMeta[v])showView(v)});renderAll();showView(viewMeta[location.hash.slice(1)]?location.hash.slice(1):'dashboard');

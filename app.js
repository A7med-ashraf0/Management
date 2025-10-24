/* ====================== CONFIG FIREBASE ====================== */
const firebaseConfig = {
  apiKey: "AIzaSyC7V0kGz3p11sjF-FMSLW4kJ5WuZzNtLX0",
  authDomain: "cafe-pc-8a386.firebaseapp.com",
  databaseURL: "https://cafe-pc-8a386-default-rtdb.firebaseio.com",
  projectId: "cafe-pc-8a386",
  storageBucket: "cafe-pc-8a386.firebasestorage.app",
  messagingSenderId: "150129569328",
  appId: "1:150129569328:web:34c4980a7b9b3a6d1947f5",
  measurementId: "G-5HJ1Z58WXF"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

/* ====================== GLOBALS ====================== */
let storeName = localStorage.getItem('storeName') || null;
let mode = 'clients';
let selectedId = null;
let selectedName = null;

/* ====================== LOGOUT ====================== */
function logout() {
  localStorage.clear();
  window.location.href = "index.html";
}

/* ====================== LOAD STORES LIST ====================== */
function loadStoresList() {
  const container = document.getElementById('storeSelectContainer');
  container.innerHTML = '<h3>اختر المتجر للعمل عليه:</h3>';
  db.ref('stores').once('value', snapshot => {
    snapshot.forEach(child => {
      const btn = document.createElement('button');
      btn.innerText = child.key;
      btn.onclick = () => openStore(child.key);
      container.appendChild(btn);
    });
  });
}

/* ====================== OPEN STORE ====================== */
function openStore(name) {
  storeName = name;
  localStorage.setItem('storeName', storeName);
  alert(`تم فتح المتجر: ${storeName}`);
  document.getElementById('storeSelectContainer').style.display = 'none';
  switchMode('clients');
}

/* ====================== SWITCH MODE ====================== */
function switchMode(newMode) {
  if (!storeName) return alert("⚠️ اختر المتجر أولاً");
  mode = newMode;
  document.getElementById('dashboardTitle').innerText = mode === 'clients' ? 'لوحة العملاء' : 'لوحة الموظفين';
  document.getElementById('clientsTitle').innerText = mode === 'clients' ? 'العملاء' : 'الموظفين';
  selectedId = null;
  selectedName = null;
  document.getElementById('debtsSection').innerHTML = "<p>اختر اسم من الجدول لعرض التفاصيل</p>";
  loadClients();
}

/* ====================== LOAD CLIENTS/STAFF ====================== */
function loadClients() {
  if (!storeName) return;
  const table = document.getElementById('clientsTable');
  db.ref(`stores/${storeName}/${mode}`).on('value', snapshot => {
    table.innerHTML = '';
    snapshot.forEach(child => {
      const client = child.val();
      const row = document.createElement('tr');
      row.innerHTML = `<td>${client.name}</td>`;
      row.dataset.id = child.key;

      row.addEventListener('click', () => {
        selectedId = child.key;
        selectedName = client.name;
        loadDebts(child.key, client.name);
        highlightRow(row);
      });

      table.appendChild(row);
    });
  });
}

/* ====================== HIGHLIGHT ROW ====================== */
function highlightRow(row) {
  document.querySelectorAll('#clientsTable tr').forEach(r => r.classList.remove('selected'));
  row.classList.add('selected');
}

/* ====================== ADD CLIENT/STAFF ====================== */
function addClient() {
  if (!storeName) return alert("⚠️ اختر المتجر أولاً");
  const name = document.getElementById('clientName').value.trim();
  if (!name) return alert("أدخل الاسم أولاً");

  const newRef = db.ref(`stores/${storeName}/${mode}`).push();
  newRef.set({ name }).then(() => {
    document.getElementById('clientName').value = '';
    loadClients();
  });
}

/* ====================== DELETE SELECTED ====================== */
function deleteClient() {
  if (!storeName) return alert("⚠️ اختر المتجر أولاً");
  if (!selectedId) return alert("اختر اسم أولاً");

  const storePass = prompt("أدخل كلمة مرور المتجر لتأكيد حذف العميل:");
  if (!storePass) return;

  db.ref(`stores/${storeName}/info/password`).once('value')
    .then(snapshot => {
      if (snapshot.val() !== storePass) {
        alert("كلمة المرور غير صحيحة!");
        return;
      }
      db.ref(`stores/${storeName}/${mode}/${selectedId}`).remove()
        .then(() => {
          selectedId = null;
          selectedName = null;
          document.getElementById('debtsSection').innerHTML = "<p>اختر اسم من الجدول لعرض التفاصيل</p>";
          loadClients();
        });
    });
}

/* ====================== DEBT FUNCTIONS ====================== */
function loadDebts(id, name) {
  const section = document.getElementById('debtsSection');
  document.getElementById('clientTitle').innerText = `تفاصيل ${name}`;
  section.innerHTML = `
    <table>
      <thead>
        <tr><th>الوصف</th><th>المبلغ</th><th>التاريخ</th><th>إجراءات</th></tr>
      </thead>
      <tbody id="debtsList"></tbody>
    </table>
    <h4>الإجمالي: <span id="totalDebt">0</span> ج</h4>
    <input type="text" id="productName" placeholder="الوصف">
    <input type="number" id="debtAmount" placeholder="المبلغ">
    </button> <button id="addDebtBtn">إضافة عملية</button>
 </button></button>
    <input type="number" id="paymentAmount" placeholder="تسجيل الدفع">
    <button id="addPaymentBtn">تسجيل دفع</button>
    <button id="deleteAllBtn">حذف كل العمليات</button>
  `;

  const debtsRef = db.ref(`stores/${storeName}/${mode}/${id}/debts`);
  debtsRef.on('value', snapshot => {
    const debtsList = document.getElementById('debtsList');
    debtsList.innerHTML = '';
    let total = 0;
    snapshot.forEach(child => {
      const debt = child.val();
      total += parseFloat(debt.amount);
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${debt.product}</td>
        <td>${debt.amount}</td>
        <td>${debt.date}</td>
        <td>
          <button onclick="editDebt('${id}','${child.key}','${debt.product}','${debt.amount}')">تعديل</button>
          <button onclick="deleteDebt('${id}','${child.key}')">حذف</button>
        </td>
      `;
      debtsList.appendChild(row);
    });
    document.getElementById('totalDebt').innerText = total;
  });

  document.getElementById('addDebtBtn').onclick = () => addDebt(id);
  document.getElementById('addPaymentBtn').onclick = () => addPayment(id);
  document.getElementById('deleteAllBtn').onclick = () => deleteAllDebts(id);
}

function addDebt(id) {
  const product = document.getElementById('productName').value.trim();
  const amount = parseFloat(document.getElementById('debtAmount').value);
  if (!product || isNaN(amount)) return alert("أدخل الوصف والمبلغ");

  db.ref(`stores/${storeName}/${mode}/${id}/debts`).push({
    product,
    amount,
    date: new Date().toLocaleString()
  }).then(() => {
    document.getElementById('productName').value = '';
    document.getElementById('debtAmount').value = '';
    loadDebts(id, selectedName);
  });
}

function addPayment(id) {
  const payment = parseFloat(document.getElementById('paymentAmount').value);
  if (!payment || payment <= 0) return alert("أدخل مبلغ صحيح");

  db.ref(`stores/${storeName}/${mode}/${id}/debts`).push({
    product: "دفع",
    amount: -payment,
    date: new Date().toLocaleString()
  }).then(() => {
    document.getElementById('paymentAmount').value = '';
    loadDebts(id, selectedName);
  });
}

function editDebt(clientId, debtId, oldProduct, oldAmount) {
  const newProduct = prompt("الوصف الجديد:", oldProduct);
  const newAmount = parseFloat(prompt("المبلغ الجديد:", oldAmount));
  if (!newProduct || isNaN(newAmount)) return alert("البيانات غير صالحة!");

  db.ref(`stores/${storeName}/${mode}/${clientId}/debts/${debtId}`).update({
    product: newProduct,
    amount: newAmount
  }).then(() => loadDebts(clientId, selectedName));
}

function deleteDebt(clientId, debtId) {
  const storePass = prompt("أدخل كلمة مرور المتجر لتأكيد الحذف:");
  if (!storePass) return;

  db.ref(`stores/${storeName}/info/password`).once('value')
    .then(snapshot => {
      if (snapshot.val() !== storePass) {
        alert("كلمة المرور غير صحيحة!");
        return;
      }
      db.ref(`stores/${storeName}/${mode}/${clientId}/debts/${debtId}`).remove()
        .then(() => loadDebts(clientId, selectedName));
    });
}

function deleteAllDebts(clientId) {
  const storePass = prompt("أدخل كلمة مرور المتجر لتأكيد حذف كل العمليات:");
  if (!storePass) return;

  db.ref(`stores/${storeName}/info/password`).once('value')
    .then(snapshot => {
      if (snapshot.val() !== storePass) {
        alert("كلمة المرور غير صحيحة!");
        return;
      }
      db.ref(`stores/${storeName}/${mode}/${clientId}/debts`).remove()
        .then(() => loadDebts(clientId, selectedName));
    });
}
/* ====================== INIT ====================== */
if (!storeName) {
  loadStoresList();
} else {
  document.getElementById('storeSelectContainer').style.display = 'none';
  switchMode('clients');
}

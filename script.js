
const accounts = [
  { username: "owner", password: "owner123", name: "صاحب الشركة", role: "المالك" },
  { username: "engineer", password: "eng123", name: "المهندس أحمد", role: "مهندس" },
  { username: "supervisor", password: "sup123", name: "المشرف محمد", role: "مشرف" },
  { username: "assistant", password: "asst123", name: "المساعد علي", role: "مساعد" }
];

const seedItems = [
  { id: 1, name: "تأسيس أعمال السباكة", category: "سباكة", status: "قيد التنفيذ", by: "المهندس أحمد", image: "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=800" },
  { id: 2, name: "تمديدات الكهرباء", category: "كهرباء", status: "قيد التنفيذ", by: "المهندس أحمد", image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800" },
  { id: 3, name: "أعمال النقاشة", category: "نقاشة", status: "لم يبدأ", by: "المهندس أحمد", image: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=800" },
  { id: 4, name: "تركيب السيراميك", category: "سيراميك", status: "مكتمل", by: "المشرف محمد", image: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800" },
  { id: 5, name: "أعمال المحارة", category: "محارة", status: "قيد التنفيذ", by: "المهندس أحمد", image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800" },
  { id: 6, name: "أعمال النجارة", category: "نجارة", status: "لم يبدأ", by: "المشرف محمد", image: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800" },
  { id: 7, name: "تركيب الألوميتال", category: "ألوميتال", status: "لم يبدأ", by: "المهندس أحمد", image: "https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=800" }
];

const $ = id => document.getElementById(id);

function readStorage(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function saveStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;",
    '"': "&quot;", "'": "&#39;"
  }[char]));
}

function safeURL(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

let current = null;
let items = readStorage("as_items", null) || seedItems;
let customers = readStorage("as_customers", []);
let settings = readStorage("as_settings", {});

function isOwner() {
  return current?.role === "المالك";
}

function canManageItems() {
  return ["المالك", "مهندس"].includes(current?.role);
}

function canUpdateItems() {
  return ["المالك", "مهندس", "مشرف"].includes(current?.role);
}

function canManageCustomers() {
  return ["المالك", "مهندس"].includes(current?.role);
}

// تسجيل الدخول
$("loginForm").addEventListener("submit", event => {
  event.preventDefault();

  const username = $("username").value.trim();
  const password = $("password").value;

  const user = accounts.find(account =>
    account.username === username &&
    account.password === password
  );

  if (!user) {
    $("loginError").textContent = "اسم المستخدم أو كلمة المرور غير صحيحة";
    return;
  }

  current = user;
  $("loginError").textContent = "";
  $("loginView").classList.add("hidden");
  $("appView").classList.remove("hidden");

  $("currentUser").textContent = user.name;
  $("currentRole").textContent = user.role;

  document.querySelectorAll(".owner-only").forEach(element => {
    element.classList.toggle("hidden", !isOwner());
  });

  renderAll();
  showPage("overview");
});

// تسجيل الخروج
$("logoutBtn").addEventListener("click", () => {
  current = null;
  $("appView").classList.add("hidden");
  $("loginView").classList.remove("hidden");
  $("loginForm").reset();
});

// التنقل
document.querySelectorAll(".nav-link").forEach(button => {
  button.addEventListener("click", () => showPage(button.dataset.page));
});

function showPage(page) {
  if (["team", "settings"].includes(page) && !isOwner()) {
    page = "overview";
  }

  document.querySelectorAll(".page").forEach(section => {
    section.classList.add("hidden");
  });

  $(page + "Page").classList.remove("hidden");

  document.querySelectorAll(".nav-link").forEach(button => {
    button.classList.toggle("active", button.dataset.page === page);
  });

  const titles = {
    overview: "الرئيسية",
    items: "بنود التشطيب",
    customers: "إدارة العملاء",
    team: "المستخدمون والصلاحيات",
    settings: "إعدادات الشركة"
  };

  $("pageTitle").textContent = titles[page];
}

// البنود
function saveItems() {
  saveStorage("as_items", items);
}

$("itemForm").addEventListener("submit", event => {
  event.preventDefault();

  if (!canManageItems()) {
    alert("ليس لديك صلاحية إضافة بند.");
    return;
  }

  const name = $("itemName").value.trim();
  const category = $("itemCategory").value.trim();
  const image = $("itemImage").value.trim();

  if (!name || !category) return;

  if (image && !safeURL(image)) {
    alert("رابط الصورة غير صحيح.");
    return;
  }

  items.unshift({
    id: Date.now(),
    name,
    category,
    image,
    status: $("itemStatus").value,
    by: current.name
  });

  saveItems();
  $("itemForm").reset();
  renderAll();
  alert("تمت إضافة البند بنجاح");
});

function statusClass(status) {
  if (status === "مكتمل") return "done";
  if (status === "لم يبدأ") return "wait";
  return "";
}

function renderGallery() {
  const categories = {};

  items.forEach(item => {
    if (!categories[item.category]) categories[item.category] = item;
  });

  const fallback = "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800";

  $("itemsGallery").innerHTML = Object.values(categories).map(item => {
    const image = safeURL(item.image) || fallback;

    return `
      <div class="item-card">
        <img src="${escapeHTML(image)}"
          alt="${escapeHTML(item.category)}"
          loading="lazy"
          onerror="this.onerror=null;this.src='${fallback}'">
        <div class="item-card-info">
          <h4>${escapeHTML(item.category)}</h4>
          <p>${escapeHTML(item.name)}</p>
          <span class="status">${escapeHTML(item.status)}</span>
        </div>
      </div>
    `;
  }).join("");
}

function renderItems() {
  $("itemsTable").innerHTML = items.map(item => {
    let actions = "";

    if (canUpdateItems()) {
      actions += `<button class="small-btn" data-action="change-item" data-id="${item.id}">تغيير الحالة</button>`;
    }

    if (isOwner()) {
      actions += `<button class="small-btn delete-btn" data-action="delete-item" data-id="${item.id}">حذف</button>`;
    }

    return `
      <tr>
        <td>${escapeHTML(item.name)}</td>
        <td>${escapeHTML(item.category)}</td>
        <td><span class="status ${statusClass(item.status)}">${escapeHTML(item.status)}</span></td>
        <td>${escapeHTML(item.by)}</td>
        <td>${actions || "عرض فقط"}</td>
      </tr>
    `;
  }).join("");

  $("recentItems").innerHTML = items.slice(0, 5).map(item => `
    <div class="recent-row">
      <b>${escapeHTML(item.name)}</b>
      <small>${escapeHTML(item.status)}</small>
    </div>
  `).join("") || "<p>لا توجد بنود حتى الآن.</p>";

  renderGallery();
}

function changeItemStatus(id) {
  if (!canUpdateItems()) return;

  const item = items.find(item => item.id === id);
  if (!item) return;

  const states = ["لم يبدأ", "قيد التنفيذ", "مكتمل"];
  const index = states.indexOf(item.status);

  item.status = states[(index + 1) % states.length];
  saveItems();
  renderAll();
}

function deleteItem(id) {
  if (!isOwner()) return;
  if (!confirm("هل تريد حذف هذا البند؟")) return;

  items = items.filter(item => item.id !== id);
  saveItems();
  renderAll();
}

// العملاء
function saveCustomers() {
  saveStorage("as_customers", customers);
}

$("customerForm").addEventListener("submit", event => {
  event.preventDefault();

  if (!canManageCustomers()) {
    alert("ليس لديك صلاحية إدارة العملاء.");
    return;
  }

  const id = $("customerId").value;

  const customer = {
    id: id ? Number(id) : Date.now(),
    name: $("customerName").value.trim(),
    phone: $("customerPhone").value.trim(),
    address: $("customerAddress").value.trim(),
    project: $("customerProject").value.trim(),
    status: $("customerStatus").value,
    notes: $("customerNotes").value.trim()
  };

  if (!customer.name || !customer.phone || !customer.project) {
    alert("أكمل البيانات المطلوبة.");
    return;
  }

  if (id) {
    customers = customers.map(old =>
      old.id === Number(id) ? customer : old
    );
    alert("تم تعديل بيانات العميل بنجاح");
  } else {
    customers.unshift(customer);
    alert("تمت إضافة العميل بنجاح");
  }

  saveCustomers();
  resetCustomerForm();
  renderAll();
});

function renderCustomers() {
  $("customersTable").innerHTML = customers.map(customer => {
    let actions = "";

    if (canManageCustomers()) {
      actions += `<button class="small-btn" data-action="edit-customer" data-id="${customer.id}">تعديل</button>`;
    }

    if (isOwner()) {
      actions += `<button class="small-btn delete-btn" data-action="delete-customer" data-id="${customer.id}">حذف</button>`;
    }

    return `
      <tr>
        <td>${escapeHTML(customer.name)}</td>
        <td>${escapeHTML(customer.phone)}</td>
        <td>${escapeHTML(customer.address || "—")}</td>
        <td>${escapeHTML(customer.project)}</td>
        <td><span class="status ${statusClass(customer.status)}">${escapeHTML(customer.status)}</span></td>
        <td>${actions || "عرض فقط"}</td>
      </tr>
    `;
  }).join("");

  $("customerCount").textContent = customers.length;

  $("customerActive").textContent = customers.filter(customer =>
    customer.status === "قيد التنفيذ"
  ).length;

  $("totalCustomers").textContent = customers.length;
}

function editCustomer(id) {
  if (!canManageCustomers()) return;

  const customer = customers.find(item => item.id === id);
  if (!customer) return;

  $("customerId").value = customer.id;
  $("customerName").value = customer.name;
  $("customerPhone").value = customer.phone;
  $("customerAddress").value = customer.address;
  $("customerProject").value = customer.project;
  $("customerStatus").value = customer.status;
  $("customerNotes").value = customer.notes || "";

  $("customerFormTitle").textContent = "تعديل بيانات العميل";
  $("customerSubmit").textContent = "حفظ التعديلات";
  $("cancelEdit").classList.remove("hidden");

  $("customerForm").scrollIntoView({ behavior: "smooth" });
}

function deleteCustomer(id) {
  if (!isOwner()) return;
  if (!confirm("هل تريد حذف هذا العميل؟")) return;

  customers = customers.filter(customer => customer.id !== id);
  saveCustomers();
  renderAll();
}

function resetCustomerForm() {
  $("customerForm").reset();
  $("customerId").value = "";
  $("customerFormTitle").textContent = "إضافة عميل جديد";
  $("customerSubmit").textContent = "إضافة العميل";
  $("cancelEdit").classList.add("hidden");
}

$("cancelEdit").addEventListener("click", resetCustomerForm);

// أزرار الجداول
document.addEventListener("click", event => {
  const button = event.target.closest("[data-action]");
  if (!button) return;

  const id = Number(button.dataset.id);
  const action = button.dataset.action;

  if (action === "change-item") changeItemStatus(id);
  if (action === "delete-item") deleteItem(id);
  if (action === "edit-customer") editCustomer(id);
  if (action === "delete-customer") deleteCustomer(id);
});

// المستخدمون
function renderTeam() {
  $("teamTable").innerHTML = accounts.map(account => {
    let permission = "عرض البيانات فقط";

    if (account.role === "المالك") permission = "كامل الصلاحيات";
    if (account.role === "مهندس") permission = "إضافة وتعديل البنود والعملاء";
    if (account.role === "مشرف") permission = "متابعة وتحديث البنود";

    return `
      <tr>
        <td>${escapeHTML(account.username)}</td>
        <td>${escapeHTML(account.name)}</td>
        <td>${escapeHTML(account.role)}</td>
        <td>${permission}</td>
      </tr>
    `;
  }).join("");
}

// الإعدادات
$("settingsForm").addEventListener("submit", event => {
  event.preventDefault();

  if (!isOwner()) return;

  const facebook = $("facebook").value.trim();
  const instagram = $("instagram").value.trim();
  const whatsapp = $("whatsapp").value.trim();

  for (const link of [facebook, instagram, whatsapp]) {
    if (link && !safeURL(link)) {
      alert("تأكد من صحة الروابط.");
      return;
    }
  }

  settings = { facebook, instagram, whatsapp };
  saveStorage("as_settings", settings);

  $("settingsMessage").textContent = "تم حفظ الإعدادات بنجاح.";
  renderSettings();
});

function renderSettings() {
  $("facebook").value = settings.facebook || "";
  $("instagram").value = settings.instagram || "";
  $("whatsapp").value = settings.whatsapp || "";

  const links = [
    ["فيسبوك", settings.facebook],
    ["إنستجرام", settings.instagram],
    ["واتساب", settings.whatsapp]
  ];

  $("socialPreview").innerHTML = links
    .filter(([name, url]) => safeURL(url))
    .map(([name, url]) => `
      <a href="${escapeHTML(safeURL(url))}"
        target="_blank" rel="noopener noreferrer">${name}</a>
    `).join("");
}

// تحديث النظام
function renderAll() {
  renderItems();
  renderCustomers();
  renderTeam();
  renderSettings();

  $("totalItems").textContent = items.length;

  $("activeItems").textContent = items.filter(item =>
    item.status === "قيد التنفيذ"
  ).length;
}

$("year").textContent = new Date().getFullYear();

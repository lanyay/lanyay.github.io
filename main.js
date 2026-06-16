document.onkeydown = function(e) {
  if (e.keyCode === 123) return false;
  if (e.ctrlKey && e.shiftKey && e.keyCode === 73) return false;
  if (e.ctrlKey && e.keyCode === 85) return false;
}
document.oncontextmenu = function(){return false;}

// 账号密码 异或加解密
const pwdKey = 31;
function strEncode(s){
  let r = "";
  for(let i=0;i<s.length;i++){
    r += String.fromCharCode(s.charCodeAt(i) ^ pwdKey);
  }
  return r;
}
function strDecode(s){
  let r = "";
  for(let i=0;i<s.length;i++){
    r += String.fromCharCode(s.charCodeAt(i) ^ pwdKey);
  }
  return r;
}

// 手机号 AES 加解密
const SECRET_KEY = CryptoJS.enc.Utf8.parse("1234567890abcdef");
const SECRET_IV = CryptoJS.enc.Utf8.parse("abcdef1234567890");
function aesEncrypt(str) {
  const srcs = CryptoJS.enc.Utf8.parse(str);
  const encrypted = CryptoJS.AES.encrypt(srcs, SECRET_KEY, {
    iv: SECRET_IV,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });
  return encrypted.ciphertext.toString(CryptoJS.enc.Hex);
}
function aesDecrypt(str) {
  const encryptedHexStr = CryptoJS.enc.Hex.parse(str);
  const srcs = CryptoJS.enc.Base64.stringify(encryptedHexStr);
  const decrypt = CryptoJS.AES.decrypt(srcs, SECRET_KEY, {
    iv: SECRET_IV,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });
  return decrypt.toString(CryptoJS.enc.Utf8);
}

let currentPhone = "";
let randomKey = "";
const TOKEN = "95a50600291b44999405b89a122cfd30";
const BASE_API = "https://api.eomsg.com/zc/data.php";
const KEY_WORD = "%e5%8f%a4%e6%80%aa%e5%8a%a0%e9%80%9f%e5%99%a8";

function checkLogin(){
  const inputUser = document.getElementById('usr').value.trim();
  const inputPass = document.getElementById('pwd').value.trim();
  const realUser = strDecode(String.fromCharCode(75^pwdKey,97^pwdKey,122^pwdKey,121^pwdKey,66^pwdKey,105^pwdKey,103^pwdKey,75^pwdKey,105^pwdKey,110^pwdKey,103^pwdKey));
  const realPass = strDecode(String.fromCharCode(75^pwdKey,97^pwdKey,122^pwdKey,121^pwdKey,66^pwdKey,105^pwdKey,103^pwdKey,75^pwdKey,105^pwdKey,110^pwdKey,103^pwdKey,49^pwdKey,49^pwdKey,52^pwdKey,53^pwdKey,49^pwdKey,52^pwdKey));
  if(inputUser === realUser && inputPass === realPass){
    sessionStorage.setItem('isAdmin', '1');
    document.getElementById('loginBox').classList.add('hidden');
    document.getElementById('adminPanel').classList.remove('hidden');
    document.getElementById('loginTip').classList.add('hidden');
  }else{
    document.getElementById('loginTip').classList.remove('hidden');
  }
}

function logout(){
  sessionStorage.removeItem('isAdmin');
  location.reload();
}

window.onload = () => {
  const params = new URLSearchParams(location.search);
  const pageKey = params.get("key");
  if(pageKey){
    renderUserPage(pageKey);
    return;
  }
  if(sessionStorage.getItem('isAdmin') === '1'){
    document.getElementById('loginBox').classList.add('hidden');
    document.getElementById('adminPanel').classList.remove('hidden');
  }
};

async function getPhoneFromAPI() {
  const btn = document.activeElement;
  btn.disabled = true;
  btn.innerText = "获取中...";
  try {
    const url = `${BASE_API}?code=getPhone&token=${TOKEN}&keyWord=${KEY_WORD}&cardType=全部`;
    const res = await fetch(url);
    const text = await res.text();
    currentPhone = text.trim();
    const encryptPhone = aesEncrypt(currentPhone);
    randomKey = Math.random().toString(36).slice(2,10);
    localStorage.setItem('tel_' + randomKey, encryptPhone);
    document.getElementById('phoneInput').value = currentPhone;
  } catch (err) {
    alert("获取手机号失败：" + err.message);
  } finally {
    btn.disabled = false;
    btn.innerText = "1. 获取手机号（调用 API-A）";
  }
}

function genUserUrl() {
  if(!currentPhone) {
    alert("请先获取手机号！");
    return;
  }
  const base = window.location.origin + window.location.pathname;
  const userUrl = `${base}?key=${randomKey}`;
  document.getElementById('linkInput').value = userUrl;
  document.getElementById('copyBtn').classList.remove('hidden');
}

async function copyUrl() {
  await navigator.clipboard.writeText(document.getElementById('linkInput').value);
  document.getElementById('copyTip').classList.remove('hidden');
  setTimeout(()=>document.getElementById('copyTip').classList.add('hidden'),2000);
}

function renderUserPage(key) {
  const encryptPhone = localStorage.getItem('tel_' + key);
  if(!encryptPhone) {
    document.body.innerHTML = `<div class="flex h-screen items-center justify-center text-red-500 text-lg">链接无效或已过期</div>`;
    return;
  }
  const phone = aesDecrypt(encryptPhone);
  document.body.innerHTML = `
  <div class="min-h-screen flex items-center justify-center p-4 bg-slate-100">
    <div class="max-w-md w-full bg-white p-7 rounded-xl shadow-lg">
      <h2 class="text-xl font-bold text-center mb-6">获取验证码</h2>
      <div class="mb-4">
        <label class="text-sm block mb-1">手机号</label>
        <input readonly value="${phone}" class="w-full bg-gray-100 border px-3 py-2 rounded">
      </div>
      <div class="mb-6">
        <label class="text-sm block mb-1">验证码</label>
        <input readonly id="codeBox" class="w-full bg-gray-100 border px-3 py-2 rounded">
      </div>
      <button onclick="getMsgFromAPI('${phone}')" id="getBtn" class="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">获取验证码</button>
    </div>
  </div>
  `;
}

async function getMsgFromAPI(phone) {
  const btn = document.getElementById('getBtn');
  btn.disabled = true;
  btn.innerText = "正在获取...";
  try {
    const url = `${BASE_API}?code=getMsg&token=${TOKEN}&keyWord=${KEY_WORD}&phone=${phone}`;
    const res = await fetch(url);
    const msg = await res.text();
    document.getElementById('codeBox').value = msg.trim();
  } catch (err) {
    alert("获取验证码失败：" + err.message);
  } finally {
    btn.disabled = false;
    btn.innerText = "获取验证码";
  }
}
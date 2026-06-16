
document.onkeydown = function(e) {
  if (e.keyCode === 123) return false;
  if (e.ctrlKey && e.shiftKey && e.keyCode === 73) return false;
  if (e.ctrlKey && e.keyCode === 85) return false;
}
document.oncontextmenu = function(){return false;}


const xorKey = 31;
function xorEncode(str) {
  let res = "";
  for (let i = 0; i < str.length; i++) {
    res += String.fromCharCode(str.charCodeAt(i) ^ xorKey);
  }
  return res;
}
function xorDecode(str) {
  let res = "";
  for (let i = 0; i < str.length; i++) {
    res += String.fromCharCode(str.charCodeAt(i) ^ xorKey);
  }
  return res;
}


function base64Encode(str) {
  return btoa(unescape(encodeURIComponent(str)));
}
function base64Decode(str) {
  return decodeURIComponent(escape(atob(str)));
}


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

const ENC_BASE_API = "aHR0cHM6Ly9hcGkuZW9tc2cuY29tL3pjL2RhdGEucGhw";
const ENC_TOKEN = "OTVhNTA2MDAyOTFiNDQ5OTk0MDViODlhMTIyY2ZkMzA=";
const ENC_KEY_WORD = "JWU1JThmJThkJWU2JgwwJWE1JThhJTAwJWU5JgwwJTkwJWU1JTl5JWE4";


const BASE_API = base64Decode(ENC_BASE_API);
const TOKEN = base64Decode(ENC_TOKEN);
const KEY_WORD = base64Decode(ENC_KEY_WORD);

const ENC_USER = String.fromCharCode(75^xorKey,97^xorKey,122^xorKey,121^xorKey,66^xorKey,105^xorKey,103^xorKey,75^xorKey,105^xorKey,110^xorKey,103^xorKey);
const ENC_PASS = String.fromCharCode(75^xorKey,97^xorKey,122^xorKey,121^xorKey,66^xorKey,105^xorKey,103^xorKey,75^xorKey,105^xorKey,110^xorKey,103^xorKey,49^xorKey,49^xorKey,52^xorKey,53^xorKey,49^xorKey,52^xorKey);


function checkLogin(){
  const inputUser = document.getElementById('usr').value.trim();
  const inputPass = document.getElementById('pwd').value.trim();
  const realUser = xorDecode(ENC_USER);
  const realPass = xorDecode(ENC_PASS);

  if (inputUser === realUser && inputPass === realPass) {
    sessionStorage.setItem('isAdmin', '1');
    document.getElementById('loginBox').classList.add('hidden');
    document.getElementById('adminPanel').classList.remove('hidden');
    document.getElementById('loginTip').classList.add('hidden');
  } else {
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
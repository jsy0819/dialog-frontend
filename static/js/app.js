function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('collapsed');
    }
}

// 페이지 전환 (SPA 스타일)
function changePage(pageName) {
  const pages = ['mainPage', 'recordingPage', 'meetingsPage'];
  pages.forEach(id => {
    const page = document.getElementById(id);
    if (page) page.classList.add('hidden');
  });

  if (pageName === 'main') {
    const mainPage = document.getElementById('mainPage');
    if (mainPage) mainPage.classList.remove('hidden');
  } else if (pageName === 'recording') {
    const recordingPage = document.getElementById('recordingPage');
    if (recordingPage) recordingPage.classList.remove('hidden');
  } else if (pageName === 'meetings') {
    const meetingsPage = document.getElementById('meetingsPage');
    if (meetingsPage) meetingsPage.classList.remove('hidden');
  }

  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => item.classList.remove('active'));
  if (event) {
    const navItem = event.target.closest('.nav-item');
    if (navItem) navItem.classList.add('active');
  }
}

function openChat() {
  const chat = document.getElementById("chatBot");
  if (!chat) return;
  chat.classList.add("open");
  const floatingBtn = document.getElementById("floatingChatBtn");
  if (floatingBtn) floatingBtn.classList.add("hidden");
  document.body.classList.add("chat-open");
}

function closeChat() {
  const chat = document.getElementById("chatBot");
  if (!chat) return;
  chat.classList.remove("open");
  const floatingBtn = document.getElementById("floatingChatBtn");
  if (floatingBtn) floatingBtn.classList.remove("hidden");
  document.body.classList.remove("chat-open");
}

function sendMessage() {
  console.log("메시지 전송 (UI만)");
}

function handleChatEnter(e) {
  if (e.key === "Enter") sendMessage();
}

// 페이지 전환 함수
function showPage(pageName) {
  document.querySelectorAll('.page').forEach(page => {
    page.classList.add('hidden');
  });

  const targetPage = document.getElementById(pageName + 'Page');
  if (targetPage) targetPage.classList.remove('hidden');

  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  const activeNav = document.querySelector(`[data-page="${pageName}"]`);
  if (activeNav) activeNav.classList.add('active');

  if (pageName === 'home' && typeof window.refreshHomeData === 'function') {
    window.refreshHomeData();
  }

  if (pageName === 'calendar' && typeof initCalendar === 'function') {
    initCalendar();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const pageName = item.getAttribute('data-page');
      if (pageName) showPage(pageName);
    });
  });
});

// 프로필 드롭다운 토글
function toggleProfileDropdown() {
  const dropdown = document.getElementById('profileDropdown');
  if (dropdown) {
    dropdown.classList.toggle('active');
  }
}

// 외부 클릭 시 드롭다운 닫기
document.addEventListener('click', function(event) {
  const dropdown = document.getElementById('profileDropdown');
  const authBtn = document.querySelector('.auth-btn');
  
  if (dropdown && authBtn) {
    if (!authBtn.contains(event.target) && !dropdown.contains(event.target)) {
      dropdown.classList.remove('active');
    }
  }
});

// 설정 페이지로 이동
function goToSettings() {
  window.location.href = 'settings.html';
  const dropdown = document.getElementById('profileDropdown');
  if (dropdown) {
    dropdown.classList.remove('active');
  }
}

// =====================================
// ✅ 유틸리티 함수
// =====================================
function getCookie(name) {
  const cookies = document.cookie.split(";").map(c => c.trim());
  for (const cookie of cookies) {
    if (cookie.startsWith(name + "=")) {
      return cookie.substring(name.length + 1);
    }
  }
  return null;
}

function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c =>
      '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    ).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) { 
    console.error('JWT 파싱 실패:', e);
    return null; 
  }
}

// =====================================
// ✅ 사용자 정보 주입 함수 (통합)
// =====================================
function injectUserInfo() {
  let user = null;
  const userData = localStorage.getItem("user");
  
  if (userData) {
    try { 
      user = JSON.parse(userData); 
    } catch(e) { 
      console.error('사용자 정보 파싱 실패:', e);
    }
  }
  
  if (!user) {
    const token = getCookie('jwt') || localStorage.getItem('accessToken') || localStorage.getItem('jwtToken');
    if (token) {
      const payload = parseJwt(token);
      if (payload) {
        user = { 
          name: payload.name || payload.email || "사용자", 
          email: payload.email || "" 
        };
      }
    }
  }

  if (user) {
    document.querySelectorAll(".user-name").forEach(el => {
      el.textContent = user.name || "사용자";
    });
    
    document.querySelectorAll(".user-email").forEach(el => {
      el.textContent = user.email || "";
    });
    
    document.querySelectorAll(".user-avatar").forEach(el => {
      el.textContent = user.name ? user.name.charAt(0).toUpperCase() : "U";
    });

    const userNameEl = document.querySelector("#user-name");
    if (userNameEl) {
      userNameEl.textContent = user.name || "사용자";
    }
    
    console.log("✅ [app.js] 로그인 사용자 표시:", user.name);
  } else {
    console.warn("⚠️ [app.js] 로그인 정보 없음");
  }
}

// =====================================
// ✅ 소셜 로그인한 사용자 정보 저장
// =====================================
function saveUserFromJwt() {
  const token = getCookie("jwt");
  if (token) {
    try {
      const payload = parseJwt(token);
      localStorage.setItem(
        "user",
        JSON.stringify({
          name: payload.name || "",
          email: payload.email || "",
        })
      );
      console.log("✅ JWT에서 사용자 정보 저장 완료");
    } catch (e) {
      console.error('JWT 저장 실패:', e);
    }
  }
}

// =====================================
// ✅ 로그아웃 함수
// =====================================
function logout() {
  if (confirm('로그아웃 하시겠습니까?')) {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('user');
    
    document.cookie = 'jwt=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    window.location.href = 'login.html';
  }
  const dropdown = document.getElementById('profileDropdown');
  if (dropdown) {
    dropdown.classList.remove('active');
  }
}

// =====================================
// ✅ 페이지 로드 시 JWT 저장만 처리
// =====================================
document.addEventListener("DOMContentLoaded", () => {
  console.log("📄 [app.js] DOMContentLoaded 실행");
  saveUserFromJwt();
});
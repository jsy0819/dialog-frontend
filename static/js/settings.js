/* ===============================
   Chatbot & Sidebar Fetch
=================================*/
document.addEventListener("DOMContentLoaded", async() => {
    await initializeChatbot();
    
    const loggedInUser = await loadCurrentUser();

    // 사이드바 로드
    fetch("components/sidebar.html")
        .then(res => res.text())
        .then(async html => {
            const sidebar = document.getElementById("sidebar-container");
            sidebar.innerHTML = html;

            // ✅ 사이드바 로드 후 사용자 정보 주입
            await loadCurrentUser();
            

            // 현재 페이지 활성화
            const currentPage = window.location.pathname.split("/").pop();
            const navItems = sidebar.querySelectorAll(".nav-menu a");

            navItems.forEach(item => {
                const linkPath = item.getAttribute("href");
                if (linkPath === currentPage) {
                    item.classList.add("active");
                } else {
                    item.classList.remove("active");
                }
            });
        })
        .catch(error => {
            console.error('사이드바 로드 실패:', error);
        });
    if (loggedInUser) {
        fillPersonalInfoFields(loggedInUser);
    }
});
// 새 함수 추가: 개인정보 섹션의 Input 필드에 사용자 정보와 로컬 설정을 주입
function fillPersonalInfoFields(user) {
    // 1. API에서 가져온 사용자 정보 주입
    document.getElementById('userName').value = user.name || '';
    document.getElementById('userEmail').value = user.email || '';

    // 2. 저장된 직무 및 직급 불러오기 (로컬 스토리지)
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
        const userData = JSON.parse(savedSettings);
        document.getElementById('jobSelect').value = userData.job || '';
        document.getElementById('positionSelect').value = userData.position || '';
    }
}

// 개인정보 섹션 토글
function togglePersonalInfo() {
    const section = document.getElementById('personalInfoSection');
    section.classList.toggle('expanded');
}

// 개인정보 저장
async function savePersonalInfo() {
    // 1. 현재 폼에 입력된 값들을 가져옵니다.
    const userName = document.getElementById('userName').value;
    const userEmail = document.getElementById('userEmail').value;
    const jobSelect = document.getElementById('jobSelect').value;
    const positionSelect = document.getElementById('positionSelect').value;

    // 2. 유효성 검사 (간단)
    if (!jobSelect || jobSelect === 'NONE') { 
        showAlert('직무를 선택해주세요.', 'error'); 
        return;
    }

    if (!positionSelect || positionSelect === 'NONE') {
        showAlert('직급을 선택해주세요.', 'error'); 
        return;
    }

    // 3. 백엔드로 보낼 데이터 객체(DTO) 생성
    const userData = {
        name: userName,
        email: userEmail,
        job: jobSelect,
        position: positionSelect
    };

    // 4. 브라우저(localStorage)에도 설정을 저장 (새로고침해도 유지되도록)
    localStorage.setItem('userSettings', JSON.stringify(userData));
    showSuccessMessage('개인정보가 저장되었습니다.');

    // 5. (핵심) 백엔드 API에 PUT 요청을 보내 DB 업데이트를 시도합니다.
    try {
        const response = await fetch(`${BACKEND_BASE_URL}/api/user/settings`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(userData)
        });

        // 6. 저장 성공/실패에 따른 피드백
        if (response.ok) {
            showSuccessMessage('개인정보가 성공적으로 저장되었습니다.');
        } else {
            const errorData = await response.json();
            alert('저장에 실패했습니다: ' + (errorData.message || response.statusText));
        }
    } catch (error) {
        console.error('프로필 업데이트 네트워크 오류', error);
        alert('서버와 통신 중 오류가 발생했습니다.');
    }
}

// 가이드 상세 페이지 표시
function showGuideDetail(type) {
    document.getElementById('guideMainMenu').style.display = 'none';

    document.getElementById('coreGuideDetail').classList.remove('active');
    document.getElementById('advancedGuideDetail').classList.remove('active');
    document.getElementById('tipsGuideDetail').classList.remove('active');

    if (type === 'core') {
        document.getElementById('coreGuideDetail').classList.add('active');
    } else if (type === 'advanced') {
        document.getElementById('advancedGuideDetail').classList.add('active');
    } else if (type === 'tips') {
        document.getElementById('tipsGuideDetail').classList.add('active');
    }
}

// 가이드 메인으로 돌아가기
function showGuideMain() {
    document.getElementById('guideMainMenu').style.display = 'block';
    document.getElementById('coreGuideDetail').classList.remove('active');
    document.getElementById('advancedGuideDetail').classList.remove('active');
    document.getElementById('tipsGuideDetail').classList.remove('active');
}

function showSuccessMessage(message) {
  const existing = document.querySelector('.success-message');
  if (existing) existing.remove();

  const msg = document.createElement('div');
  msg.className = 'success-message';
  msg.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%) translateY(-20px);
    background: linear-gradient(135deg, #8E44AD 0%, #9b59b6 100%);
    color: white;
    padding: 10px 16px;
    border-radius: 20px;
    box-shadow: 0 2px 12px rgba(142, 68, 173, 0.3);
    z-index: 10000;
    display: flex;
    align-items: center;
    gap: 8px;
    opacity: 0;
    transition: all 0.4s cubic-bezier(0.68, -0.55, 0.27, 1.55);
    max-width: 400px;
    font-weight: 500;
    font-size: 14px;
  `;
  msg.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
    <span>${message}</span>
  `;
  document.body.appendChild(msg);

  // 등장 애니메이션
  requestAnimationFrame(() => {
    msg.style.opacity = '1';
    msg.style.transform = 'translateX(-50%) translateY(0)';
  });

  setTimeout(() => {
    msg.style.opacity = '0';
    msg.style.transform = 'translateX(-50%) translateY(-20px)';
    setTimeout(() => msg.remove(), 400);
  }, 3000);
}

function showErrorMessage(message) {
  const existing = document.querySelector('.error-message');
  if (existing) existing.remove();

  const msg = document.createElement('div');
  msg.className = 'error-message';
  msg.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%) translateY(-20px);
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    color: white;
    padding: 10px 16px;
    border-radius: 20px;
    box-shadow: 0 2px 12px rgba(239, 68, 68, 0.3);
    z-index: 10000;
    display: flex;
    align-items: center;
    gap: 8px;
    opacity: 0;
    transition: all 0.4s cubic-bezier(0.68, -0.55, 0.27, 1.55);
    max-width: 400px;
    font-weight: 500;
    font-size: 14px;
  `;
  msg.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
    <span>${message}</span>
  `;
  document.body.appendChild(msg);

  // 등장 애니메이션
  requestAnimationFrame(() => {
    msg.style.opacity = '1';
    msg.style.transform = 'translateX(-50%) translateY(0)';
  });

  setTimeout(() => {
    msg.style.opacity = '0';
    msg.style.transform = 'translateX(-50%) translateY(-20px)';
    setTimeout(() => msg.remove(), 400);
  }, 3000);
}

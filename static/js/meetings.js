/* ===============================
   Chatbot & Sidebar Fetch
=================================*/
document.addEventListener("DOMContentLoaded", () => {
    // 챗봇 로드
    fetch("components/chatbot.html")
        .then(res => res.text())
        .then(html => {
            const container = document.getElementById("chatbot-container");
            container.innerHTML = html;

            const closeBtn = container.querySelector(".close-chat-btn");
            const sendBtn = container.querySelector(".send-btn");
            const chatInput = container.querySelector("#chatInput");
            const floatingBtn = document.getElementById("floatingChatBtn");

            if (closeBtn) closeBtn.addEventListener("click", closeChat);
            if (sendBtn) sendBtn.addEventListener("click", sendMessage);
            if (chatInput) chatInput.addEventListener("keypress", handleChatEnter);
            if (floatingBtn) floatingBtn.addEventListener("click", openChat);
        });
    
    // 사이드바 로드
    fetch("components/sidebar.html")
        .then(res => res.text())
        .then(html => {
            const sidebar = document.getElementById("sidebar-container");
            sidebar.innerHTML = html;

            // ✅ 사이드바 로드 후 사용자 정보 주입
            injectUserInfo();

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
});

/* ===============================
   사용자 정보 표시 함수
=================================*/
function injectUserInfo() {
    // localStorage에서 사용자 정보 가져오기
    let user = null;
    const userData = localStorage.getItem("user");
    
    if (userData) {
        try { 
            user = JSON.parse(userData); 
        } catch(e) { 
            console.error('사용자 정보 파싱 실패:', e);
        }
    }
    
    // JWT 토큰에서 정보 추출 시도
    if (!user) {
        const token = getCookie('jwt') || localStorage.getItem('accessToken');
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

    // 사용자 정보가 있으면 표시
    if (user) {
        // 이름 표시 (.user-name 셀렉터 사용)
        document.querySelectorAll(".user-name").forEach(el => {
            el.textContent = user.name || "사용자";
        });
        
        // 이메일 표시
        document.querySelectorAll(".user-email").forEach(el => {
            el.textContent = user.email || "";
        });
        
        // 아바타 표시
        document.querySelectorAll(".user-avatar").forEach(el => {
            el.textContent = user.name ? user.name.charAt(0).toUpperCase() : "U";
        });
        
        console.log("✅ 로그인 사용자 표시:", user.name);
    } else {
        console.warn("⚠️ 로그인 정보 없음");
        // 필요시 로그인 페이지로 리다이렉트
        // window.location.href = 'login.html';
    }
}

// 검색 토글
const searchToggleBtn = document.getElementById('searchToggleBtn');
const searchPanel = document.getElementById('searchPanel');
const searchInput = document.getElementById('searchInput');
const searchClearBtn = document.getElementById('searchClearBtn');

if (searchToggleBtn) {
  searchToggleBtn.addEventListener('click', () => {
    searchPanel.classList.toggle('hidden');
    if (!searchPanel.classList.contains('hidden')) {
      searchInput.focus();
    }
  });
}

// 검색 입력 감지
if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    const wrapper = e.target.closest('.search-input-wrapper');
    if (e.target.value.trim() !== '') {
      wrapper.classList.add('has-value');
    } else {
      wrapper.classList.remove('has-value');
    }
    
    // 실제 검색 로직은 여기에 구현
    filterMeetings(e.target.value);
  });
}

// 검색 지우기
if (searchClearBtn) {
  searchClearBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchInput.closest('.search-input-wrapper').classList.remove('has-value');
    searchInput.focus();
    filterMeetings('');
  });
}

// 정렬 선택
const sortSelect = document.getElementById('sortSelect');
if (sortSelect) {
  sortSelect.addEventListener('change', (e) => {
    sortMeetings(e.target.value);
  });
}

// 우선순위 필터
const priorityFilter = document.getElementById('priorityFilter');
if (priorityFilter) {
  priorityFilter.addEventListener('change', (e) => {
    filterByPriority(e.target.value);
  });
}

// 회의록 필터링 (검색)
function filterMeetings(query) {
  const rows = document.querySelectorAll('.table-row');
  const lowerQuery = query.toLowerCase();
  
  rows.forEach(row => {
    // 두 번째 cell의 제목 가져오기
    const titleCell = row.querySelectorAll('.table-cell')[1];
    const title = titleCell ? titleCell.querySelector('.cell-primary').textContent.toLowerCase() : '';
    const keywords = Array.from(row.querySelectorAll('.keyword-tag'))
      .map(tag => tag.textContent.toLowerCase())
      .join(' ');
    
    if (title.includes(lowerQuery) || keywords.includes(lowerQuery)) {
      row.style.display = '';
    } else {
      row.style.display = 'none';
    }
  });
}

// 회의록 정렬
function sortMeetings(sortType) {
  const tableCard = document.querySelector('.table-card');
  const rows = Array.from(document.querySelectorAll('.table-row'));
  
  console.log('정렬 전:', rows.map(r => r.querySelectorAll('.table-cell')[1].querySelector('.cell-primary').textContent));
  
  // 정렬
  rows.sort((a, b) => {
    switch(sortType) {
      case 'date-desc': // 최신순
        const dateA_desc = new Date(a.getAttribute('data-date'));
        const dateB_desc = new Date(b.getAttribute('data-date'));
        return dateB_desc - dateA_desc;
        
      case 'date-asc': // 오래된순
        const dateA_asc = new Date(a.getAttribute('data-date'));
        const dateB_asc = new Date(b.getAttribute('data-date'));
        return dateA_asc - dateB_asc;
      
      case 'title-asc': // 제목순
        const titleCellA = a.querySelectorAll('.table-cell')[1];
        const titleCellB = b.querySelectorAll('.table-cell')[1];
        const titleA = titleCellA.querySelector('.cell-primary').textContent.trim();
        const titleB = titleCellB.querySelector('.cell-primary').textContent.trim();
        const result = titleA.localeCompare(titleB, 'ko');
        console.log(`비교: "${titleA}" vs "${titleB}" = ${result}`);
        return result;
      
      case 'duration-desc': // 시간 긴 순
        const durationA = parseInt(a.getAttribute('data-duration'));
        const durationB = parseInt(b.getAttribute('data-duration'));
        return durationB - durationA;
      
      default:
        return 0;
    }
  });
  
  console.log('정렬 후:', rows.map(r => r.querySelectorAll('.table-cell')[1].querySelector('.cell-primary').textContent));
  
  // 모든 row를 detach
  rows.forEach(row => row.parentNode.removeChild(row));
  
  // 정렬된 순서대로 다시 추가
  rows.forEach(row => {
    tableCard.appendChild(row);
  });
  
  console.log('DOM 업데이트 완료');
}

// 우선순위별 필터
function filterByPriority(priority) {
  const rows = document.querySelectorAll('.table-row');
  
  rows.forEach(row => {
    const rowPriority = row.getAttribute('data-priority');
    if (priority === 'all' || rowPriority === priority) {
      row.style.display = '';
    } else {
      row.style.display = 'none';
    }
  });
}

// 회의록 상세 페이지로 이동
function goToMeetingDetail(meetingId) {
  window.location.href = `meetingDetail.html?id=${meetingId}`;
}
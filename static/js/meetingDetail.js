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



let isEditMode = false;
let originalContent = '';

// 뒤로가기
function goBack() {
  window.history.back();
}

// 수정 모드 토글
function toggleEdit() {
  isEditMode = !isEditMode;

  const contentView = document.getElementById('contentView');
  const contentEditor = document.getElementById('contentEditor');
  const editNotice = document.getElementById('editNotice');
  const editActions = document.getElementById('editActions');
  const editToggleBtn = document.getElementById('editToggleBtn');

  if (isEditMode) {
    // 수정 모드 활성화
    originalContent = contentView.innerHTML;
    contentEditor.value = contentView.innerText;

    contentView.classList.add('hidden');
    contentEditor.classList.remove('hidden');
    editNotice.classList.remove('hidden');
    editActions.classList.remove('hidden');

    editToggleBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M18 6L6 18M6 6l12 12" />
      </svg>
      취소
    `;
  } else {
    // 수정 모드 비활성화
    cancelEdit();
  }
}

// 수정 취소
function cancelEdit() {
  isEditMode = false;

  const contentView = document.getElementById('contentView');
  const contentEditor = document.getElementById('contentEditor');
  const editNotice = document.getElementById('editNotice');
  const editActions = document.getElementById('editActions');
  const editToggleBtn = document.getElementById('editToggleBtn');

  contentView.classList.remove('hidden');
  contentEditor.classList.add('hidden');
  editNotice.classList.add('hidden');
  editActions.classList.add('hidden');

  editToggleBtn.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
    수정
  `;
}

// 수정 저장
function saveEdit() {
  const contentEditor = document.getElementById('contentEditor');
  const contentView = document.getElementById('contentView');

  const newContent = contentEditor.value;

  // 간단한 텍스트를 HTML로 변환 (실제로는 마크다운 파서 등 사용)
  const formattedContent = formatContent(newContent);
  contentView.innerHTML = formattedContent;

  // 서버에 저장하는 로직 추가 필요
  console.log('Content saved:', newContent);

  // 수정 모드 종료
  cancelEdit();

  // 저장 완료 알림
  showNotification('회의록이 저장되었습니다.');
}

// 간단한 텍스트 포맷팅
function formatContent(text) {
  // 실제로는 마크다운 파서나 더 복잡한 로직 사용
  return text
    .split('\n\n')
    .map(para => `<p>${para.replace(/\n/g, '<br>')}</p>`)
    .join('');
}

// PDF 내보내기
function exportToPDF() {
  // 실제 PDF 생성 로직은 jsPDF 같은 라이브러리 사용
  console.log('Exporting to PDF...');

  // 간단한 구현: 인쇄 대화상자 열기
  window.print();

  showNotification('PDF 다운로드가 준비되었습니다.');
}

// 알림 표시
function showNotification(message) {
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}

// 우선순위 변경
const prioritySelect = document.getElementById('prioritySelect');
if (prioritySelect) {
  prioritySelect.addEventListener('change', (e) => {
    const newPriority = e.target.value;
    e.target.className = `priority-select-large ${newPriority}`;

    // 서버에 저장하는 로직 추가 필요
    console.log('Priority changed to:', newPriority);
    showNotification('우선순위가 변경되었습니다.');
  });
}

// 키워드 클릭 이벤트
document.querySelectorAll('.keyword-chip').forEach(chip => {
  chip.addEventListener('click', (e) => {
    const keyword = e.target.textContent;
    console.log('Keyword clicked:', keyword);
    // 키워드 검색이나 필터링 기능 추가 가능
  });
});

// 수정 페이지로 이동 (RecordFinish 페이지로)
function goToEdit() {
  const urlParams = new URLSearchParams(window.location.search);
  const meetingId = urlParams.get('id') || '1';
  window.location.href = `recordFinish.html?id=${meetingId}`;
}

// PDF 내보내기
function exportPDF() {
  console.log('Exporting to PDF...');
  window.print();
  showSuccessMessage('PDF 다운로드가 준비되었습니다.');
}

// 성공 메시지 표시
function showSuccessMessage(message) {
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.style.cssText = `
        position: fixed; top: 24px; right: 24px;
        background: #10b981; color: white;
        padding: 16px 24px; border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        z-index: 9999; font-weight: 500;
        animation: slideIn 0.3s ease;
    `;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => document.body.removeChild(notification), 300);
  }, 3000);
}

// 애니메이션
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
`;
document.head.appendChild(style);


// 페이지 로드 시 발화 로그 렌더링
function renderTranscripts() {
  var transcriptList = document.getElementById('transcriptList');

  mockTranscripts.forEach(function (item) {
    var transcriptItem = document.createElement('div');
    transcriptItem.className = 'transcript-item';
    transcriptItem.innerHTML =
      '<div class="speaker-avatar-wrapper">' +
      '<div class="speaker-avatar mapped">' + item.initial + '</div>' +
      '</div>' +
      '<div class="transcript-content">' +
      '<div class="transcript-header">' +
      '<div class="transcript-meta">' +
      '<span class="speaker-name mapped">' + item.speaker + '</span>' +
      '<span class="time-stamp">' + item.timestamp + '</span>' +
      '</div>' +
      '</div>' +
      '<div class="transcript-text">' + item.text + '</div>' +
      '</div>';
    transcriptList.appendChild(transcriptItem);
  });
}

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', function () {
  renderTranscripts();
});

// 키워드 검색 기능
function searchKeyword() {
  var input = document.getElementById('keywordSearchInput');
  var keyword = input.value.trim();

  if (!keyword) return;

  clearHighlights();
  highlightKeyword(keyword);

  // 클리어 버튼 표시
  document.querySelector('.keyword-clear-btn').classList.remove('hidden');
}

function quickSearchKeyword(keyword) {
  var input = document.getElementById('keywordSearchInput');
  input.value = keyword;
  searchKeyword();
}

function clearKeywordSearch() {
  var input = document.getElementById('keywordSearchInput');
  input.value = '';
  clearHighlights();

  // 클리어 버튼 숨기기
  document.querySelector('.keyword-clear-btn').classList.add('hidden');
}

function highlightKeyword(keyword) {
  var regex = new RegExp('(' + escapeRegExp(keyword) + ')', 'gi');

  // AI 요약에서 하이라이트
  highlightInElements('.summary-text', regex);

  // 회의 내용에서 하이라이트
  highlightInElements('.transcript-text', regex);
}

function highlightInElements(selector, regex) {
  var elements = document.querySelectorAll(selector);

  elements.forEach(function (element) {
    var originalText = element.textContent;
    var highlightedText = originalText.replace(regex, '<mark class="keyword-highlight">$1</mark>');

    if (originalText !== highlightedText) {
      element.innerHTML = highlightedText;
    }
  });
}

function clearHighlights() {
  var highlights = document.querySelectorAll('.keyword-highlight');

  highlights.forEach(function (mark) {
    var parent = mark.parentNode;
    parent.replaceChild(document.createTextNode(mark.textContent), mark);
    parent.normalize();
  });
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Enter 키로 검색
document.addEventListener('DOMContentLoaded', function () {
  var input = document.getElementById('keywordSearchInput');
  if (input) {
    input.addEventListener('keypress', function (e) {
      if (e.key === 'Enter') {
        searchKeyword();
      }
    });
  }
});

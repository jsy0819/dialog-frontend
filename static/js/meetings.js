/* ===============================
   meetings.js - 회의록 목록 관리 (정렬/필터/검색 포함)
=================================*/

// 전체 데이터를 저장할 전역 변수
let allMeetings = [];

document.addEventListener("DOMContentLoaded", () => {
    // 사이드바 로드
    fetch("components/sidebar.html")
        .then(res => res.text())
        .then(html => {
            document.getElementById("sidebar-container").innerHTML = html;
            if (typeof loadCurrentUser === 'function') loadCurrentUser();
            const navItems = document.querySelectorAll(".nav-menu a");
            navItems.forEach(el => el.classList.remove("active"));
            navItems.forEach(item => {
                if (item.getAttribute("href") === "meetings.html") item.classList.add("active");
            });
        });

    // 챗봇 로드
    fetch("components/chatbot.html")
        .then(res => res.text())
        .then(html => {
            const container = document.getElementById("chatbot-container");
            container.innerHTML = html;
            // (챗봇 이벤트 연결 로직 생략 - 기존 유지)
            const closeBtn = container.querySelector(".close-chat-btn");
            const sendBtn = container.querySelector(".send-btn");
            const chatInput = container.querySelector("#chatInput");
            const floatingBtn = document.getElementById("floatingChatBtn");
            if (closeBtn) closeBtn.addEventListener("click", () => { if (typeof closeChat === 'function') closeChat(); });
            if (sendBtn) sendBtn.addEventListener("click", () => { if (typeof sendMessage === 'function') sendMessage(); });
            if (chatInput) chatInput.addEventListener("keypress", (e) => { if (typeof handleChatEnter === 'function') handleChatEnter(e); });
            if (floatingBtn) floatingBtn.addEventListener("click", () => { if (typeof openChat === 'function') openChat(); });
        });

    setupEventListeners();
    fetchMeetings();
});

function setupEventListeners() {
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) sortSelect.addEventListener('change', applyFilters);

    const priorityFilter = document.getElementById('priorityFilter');
    if (priorityFilter) priorityFilter.addEventListener('change', applyFilters);

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const wrapper = e.target.closest('.search-input-wrapper');
            if (wrapper) e.target.value ? wrapper.classList.add('has-value') : wrapper.classList.remove('has-value');
            applyFilters();
        });
    }
    // (검색 초기화, 패널 토글 등 기존 코드 유지)
    const searchClearBtn = document.getElementById('searchClearBtn');
    if (searchClearBtn) {
        searchClearBtn.addEventListener('click', () => {
            const input = document.getElementById('searchInput');
            input.value = '';
            input.closest('.search-input-wrapper').classList.remove('has-value');
            applyFilters();
        });
    }
    const searchToggleBtn = document.getElementById('searchToggleBtn');
    const searchPanel = document.getElementById('searchPanel');
    if (searchToggleBtn && searchPanel) {
        searchToggleBtn.addEventListener('click', () => {
            searchPanel.classList.toggle('hidden');
            if (!searchPanel.classList.contains('hidden')) document.getElementById('searchInput').focus();
        });
    }
}

async function fetchMeetings() {
    try {
        const response = await fetch(`${BACKEND_BASE_URL}/api/meetings`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });

        if (response.status === 401) {
            alert("로그인이 필요합니다.");
            window.location.href = "login.html";
            return;
        }
        if (!response.ok) throw new Error("회의록 목록을 불러오지 못했습니다.");

        allMeetings = await response.json();
        applyFilters();

    } catch (error) {
        console.error("Error fetching meetings:", error);
        showErrorState();
    }
}
// 로딩 상태 표시
function showLoadingState() {
    const loadingState = document.getElementById('loadingState');
    if (loadingState) {
        loadingState.style.display = 'block';
    }
}
/* 통합 필터링 및 정렬 로직 */
function applyFilters() {
    let result = [...allMeetings];

    const searchInput = document.getElementById('searchInput');
    const keyword = searchInput ? searchInput.value.trim().toLowerCase() : "";
    
    if (keyword) {
        result = result.filter(m => {
            const title = (m.title || "").toLowerCase();
            const keywordsStr = (m.keywords || []).map(k => (typeof k === 'object' ? k.text : k).toLowerCase()).join(" ");
            return title.includes(keyword) || keywordsStr.includes(keyword);
        });
    }

    const priorityFilter = document.getElementById('priorityFilter');
    const priorityVal = priorityFilter ? priorityFilter.value : "all";

    if (priorityVal !== "all") {
        result = result.filter(m => {
            // 중요도가 null/undefined면 "NONE" 문자열로 취급
            let level = "NONE"; 
            if (m.importance) {
                level = (typeof m.importance === 'object') ? m.importance.level : m.importance;
            }
            // "NONE"은 "MEDIUM"과 다르므로 필터링에서 제외됨
            return String(level || "NONE").toUpperCase() === priorityVal.toUpperCase();
        });
    }

    const sortSelect = document.getElementById('sortSelect');
    const sortVal = sortSelect ? sortSelect.value : "date-desc";

    result.sort((a, b) => {
        const dateA = new Date(a.scheduledAt || a.meetingDate || 0);
        const dateB = new Date(b.scheduledAt || b.meetingDate || 0);
        const durA = a.durationSeconds || 0;
        const durB = b.durationSeconds || 0;
        const titleA = (a.title || "").toLowerCase();
        const titleB = (b.title || "").toLowerCase();

        switch (sortVal) {
            case 'date-desc': return dateB - dateA;
            case 'date-asc': return dateA - dateB; 
            case 'title-asc': return titleA.localeCompare(titleB);
            case 'duration-desc': return durB - durA;
            default: return dateB - dateA;
        }
    });

    renderMeetingList(result);
}

/* 목록 그리기 */
function renderMeetingList(meetings) {
    const tableCard = document.querySelector('.table-card');
    const header = tableCard.querySelector('.table-header'); 
    
    tableCard.innerHTML = '';
    if (header) tableCard.appendChild(header);

    if (!meetings || meetings.length === 0) {
        const emptyDiv = document.createElement('div');
        emptyDiv.style.padding = "60px 0";
        emptyDiv.style.textAlign = "center";
        emptyDiv.style.color = "#9ca3af";
        emptyDiv.innerHTML = `<p>조건에 맞는 회의록이 없습니다.</p>`;
        tableCard.appendChild(emptyDiv);
        return;
    }

    meetings.forEach(meeting => {
        const dateObj = new Date(meeting.scheduledAt || meeting.meetingDate);
        const dateStr = `${(dateObj.getMonth()+1).toString().padStart(2, '0')}/${dateObj.getDate().toString().padStart(2, '0')}`;
        const timeStr = `${dateObj.getHours().toString().padStart(2, '0')}:${dateObj.getMinutes().toString().padStart(2, '0')}`;

        let pClass = 'pending';
        let pLabel = '-';

        // 중요도가 있거나, 완료된 상태라면 값 확인
        if (meeting.importance) {
            let priority = "MEDIUM";
            let reason = "";
            
            if (typeof meeting.importance === 'object') {
                priority = meeting.importance.level;
                reason = meeting.importance.reason;
            } else {
                priority = meeting.importance;
            }

            // 사유가 있어야 진짜 분석 완료된 것으로 간주
            if (reason && reason.trim() !== "") {
                pClass = getPriorityClass(priority);
                pLabel = getPriorityLabel(priority);
            }
        }

        const keywordHtml = renderKeywords(meeting.keywords);

        const row = document.createElement('div');
        row.className = 'table-row';
        row.onclick = () => goToMeetingDetail(meeting.meetingId || meeting.id); 

        row.innerHTML = `
            <div class="table-cell"><span class="cell-primary">${dateStr}</span><span class="cell-secondary">${timeStr}</span></div>
            <div class="table-cell"><span class="cell-primary">${meeting.title}</span></div>
            <div class="table-cell"><span class="cell-secondary">${(meeting.participants || []).length}명</span></div>
            <div class="table-cell"><span class="cell-secondary">${formatDuration(meeting.durationSeconds || 0)}</span></div>
            <div class="table-cell"><span class="priority-badge ${pClass}">${pLabel}</span></div>
            <div class="table-cell"><div class="keyword-list">${keywordHtml}</div></div>
        `;
        tableCard.appendChild(row);
    });
}

// 에러 표시 함수
function showErrorState() {
    const tableCard = document.querySelector('.table-card');
    const header = tableCard.querySelector('.table-header');
    tableCard.innerHTML = '';
    if(header) tableCard.appendChild(header);
    
    const errDiv = document.createElement('div');
    errDiv.style.padding = "20px";
    errDiv.style.textAlign = "center";
    errDiv.style.color = "#ef4444";
    errDiv.innerHTML = "데이터를 불러오는 중 오류가 발생했습니다.<br>잠시 후 다시 시도해주세요.";
    tableCard.appendChild(errDiv);
}

// --- 헬퍼 함수들 ---

function getPriorityClass(p) {
    if (!p) return 'medium';
    p = String(p).toUpperCase();
    if (p === 'HIGH' || p === '높음') return 'high';
    if (p === 'LOW' || p === '낮음') return 'low';
    return 'medium';
}

function getPriorityLabel(p) {
    if (!p) return '보통';
    p = String(p).toUpperCase();
    if (p === 'HIGH' || p === '높음') return '높음';
    if (p === 'LOW' || p === '낮음') return '낮음';
    return '보통';
}

function formatDuration(seconds) {
    if (!seconds) return "0분";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}시간 ${m}분`;
    return `${m}분`;
}

function renderKeywords(keywords) {
    if (!keywords || keywords.length === 0) return '';
    
    // DTO: [{text: "키워드", source: "AI"}, ...] 또는 ["키워드", ...]
    const list = keywords.map(k => (typeof k === 'object' ? k.text : k));
    
    const max = 2;
    let html = list.slice(0, max).map(k => `<span class="keyword-tag">#${k}</span>`).join('');
    
    if (list.length > max) {
        html += `<span class="keyword-more">+${list.length - max}</span>`;
    }
    return html;
}

function goToMeetingDetail(id) {
    if(id) window.location.href = `meetingDetail.html?id=${id}`;
}
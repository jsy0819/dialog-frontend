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
            loadCurrentUser();

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


// localStorage 키
const STORAGE_KEY = 'calendar_events';
const TODO_STORAGE_KEY = 'calendar_todos';

// 현재 날짜
const today = new Date();
const todayOnlyDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
const currentYear = today.getFullYear();
const currentMonth = today.getMonth();

// 전역 변수 추가
let globalEvents = [];
let globalTodos = [];

// 날짜 포맷 함수
function formatCurrentDate() {
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const month = today.getMonth() + 1;
    const date = today.getDate();
    const dayOfWeek = days[today.getDay()];
    
    return `${month}월 ${date}일 (${dayOfWeek})`;
}

// 페이지 헤더에 날짜 표시
function displayCurrentDate() {
    const dateDisplay = document.getElementById('current-date-display');
    if (dateDisplay) {
        dateDisplay.textContent = formatCurrentDate();
    }
}

// 날짜를 YYYY-MM-DD 형식으로 변환
function formatDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// localStorage에서 이벤트 로드
function loadEvents() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.map(event => ({
            ...event,
            date: new Date(event.date)
        }));
    }
    return [];
}

// localStorage에서 TODO 로드
function loadTodos() {
    const stored = localStorage.getItem(TODO_STORAGE_KEY);
    if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.map(todo => ({
            ...todo,
            date: new Date(todo.date)
        }));
    }
    return [];
}

// localStorage에 저장
function saveEvents(events) {
    console.log('💾 [홈] 이벤트 저장:', events.length, '개');
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

function saveTodos(todos) {
    console.log('💾 [홈] TODO 저장:', todos.length, '개');
    localStorage.setItem(TODO_STORAGE_KEY, JSON.stringify(todos));
}

// 특정 날짜의 이벤트 가져오기
function getEventsForDate(date, events) {
    const dateString = formatDateString(date);
    return events.filter(event => {
        const eventDateString = formatDateString(event.date);
        return eventDateString === dateString;
    });
}

// 홈 TODO 리스트 렌더링
function renderHomeTodoList(events, todos) {
    const todoListEl = document.querySelector('.todo-list');
    if (!todoListEl) return;
    
    const todayEvents = getEventsForDate(todayOnlyDate, events);
    const personalEvents = todayEvents.filter(e => e.type === 'personal');
    
    const todayTodos = todos.filter(t => {
        const todoDate = new Date(t.date);
        return formatDateString(todoDate) === formatDateString(todayOnlyDate);
    });
    
    const allTodos = [
        ...personalEvents.map(e => {
            const matchedTodo = todayTodos.find(t => t.title === e.title);
            return { 
                title: e.title, 
                completed: matchedTodo ? matchedTodo.completed : false, 
                type: 'personal' 
            };
        }),
        ...todayTodos.map(t => ({ 
            title: t.title, 
            completed: t.completed || false, 
            type: t.type 
        }))
    ];
    
    const uniqueTodos = [];
    const seenTitles = new Set();
    allTodos.forEach(todo => {
        if (!seenTitles.has(todo.title)) {
            seenTitles.add(todo.title);
            uniqueTodos.push(todo);
        }
    });
    
    todoListEl.innerHTML = '';
    
    if (uniqueTodos.length === 0) {
        todoListEl.innerHTML = `
            <div class="todo-item">
                <span class="cell-secondary" style="margin-left: 32px;">오늘의 할 일이 없습니다</span>
            </div>
        `;
        return;
    }
    
    uniqueTodos.forEach((todo, index) => {
        const todoItem = document.createElement('div');
        todoItem.className = `todo-item ${todo.completed ? 'completed' : ''}`;
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'todo-checkbox';
        checkbox.id = `home-todo-${index}`;
        checkbox.checked = todo.completed || false;
        
        checkbox.addEventListener('change', (e) => {
            const isCompleted = e.target.checked;
            
            if (isCompleted) {
                todoItem.classList.add('completed');
            } else {
                todoItem.classList.remove('completed');
            }
            
            const todoIndex = globalTodos.findIndex(t => 
                t.title === todo.title && 
                formatDateString(new Date(t.date)) === formatDateString(todayOnlyDate)
            );
            
            if (todoIndex !== -1) {
                globalTodos[todoIndex].completed = isCompleted;
            } else {
                globalTodos.push({
                    date: todayOnlyDate,
                    title: todo.title,
                    type: 'personal',
                    completed: isCompleted
                });
            }
            
            saveTodos(globalTodos);
            console.log('✅ [홈] TODO 완료 상태 저장:', todo.title, isCompleted);
        });
        
        const label = document.createElement('label');
        label.htmlFor = `home-todo-${index}`;
        label.className = 'todo-label';
        label.textContent = todo.title;
        
        todoItem.appendChild(checkbox);
        todoItem.appendChild(label);
        todoListEl.appendChild(todoItem);
    });
    
    console.log('✅ [홈] TODO 리스트 렌더링 완료:', uniqueTodos.length, '개');
}

// 중요 회의 렌더링 (다가오는 일정/마감일)
function renderImportantMeetings(events) {
    const deadlineListEl = document.querySelector('.deadline-list');
    if (!deadlineListEl) return;
    
    const importantMeetings = events.filter(e => 
        e.important === true && 
        new Date(e.date) >= todayOnlyDate
    ).sort((a, b) => new Date(a.date) - new Date(b.date));
    
    deadlineListEl.innerHTML = '';
    
    if (importantMeetings.length === 0) {
        deadlineListEl.innerHTML = `
            <div class="empty-message" style="color: #9ca3af; text-align: center; padding: 24px 0;">등록된 중요 회의가 없습니다</div>
        `;
        return;
    }
    
    importantMeetings.forEach(meeting => {
        const meetingDate = new Date(meeting.date);
        const diffTime = meetingDate - todayOnlyDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        const isUrgent = diffDays <= 3;
        
        const deadlineItem = document.createElement('div');
        deadlineItem.className = `deadline-item ${isUrgent ? 'urgent' : ''}`;
        
        const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
        const month = meetingDate.getMonth() + 1;
        const day = meetingDate.getDate();
        const dayOfWeek = dayNames[meetingDate.getDay()];
        
        deadlineItem.innerHTML = `
            <div class="deadline-info">
                <div class="deadline-title">${meeting.title}</div>
                <div class="deadline-meta">
                    <span class="deadline-date">${month}/${String(day).padStart(2, '0')} (${dayOfWeek})</span>
                    <span class="deadline-badge ${isUrgent ? 'urgent' : ''}">D-${diffDays}</span>
                </div>
            </div>
        `;
        
        deadlineListEl.appendChild(deadlineItem);
    });
    
    console.log('✅ [홈] 중요 회의 렌더링 완료:', importantMeetings.length, '개');
}

// 최근 회의 렌더링
function renderRecentMeetings(events) {
    const meetingListEl = document.querySelector('.meeting-list');
    if (!meetingListEl) return;
    
    const pastMeetings = events.filter(e => 
        (e.type === 'meeting' || e.type === 'team' || e.type === 'important') &&
        new Date(e.date) < todayOnlyDate
    ).sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 3);
    
    meetingListEl.innerHTML = '';
    
    if (pastMeetings.length === 0) {
        meetingListEl.innerHTML = `
            <div class="empty-message" style="color: #9ca3af; text-align: center; padding: 24px 0;">최근 회의가 없습니다</div>
        `;
        return;
    }
    
    pastMeetings.forEach(meeting => {
        const meetingDate = new Date(meeting.date);
        const month = meetingDate.getMonth() + 1;
        const day = meetingDate.getDate();
        
        const meetingItem = document.createElement('div');
        meetingItem.className = 'meeting-item';
        
        meetingItem.innerHTML = `
            <div class="meeting-info">
                <div class="meeting-title">${meeting.title}</div>
                <div class="meeting-meta">
                    <span class="meeting-date">${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}</span>
                    <span class="meeting-participants">팀 회의</span>
                </div>
            </div>
        `;
        
        meetingListEl.appendChild(meetingItem);
    });
    
    console.log('✅ [홈] 최근 회의 렌더링 완료:', pastMeetings.length, '개');
}

// 홈 페이지가 표시될 때마다 데이터 새로고침
window.refreshHomeData = function() {
    console.log('🔄 [홈] 데이터 새로고침');
    globalEvents = loadEvents();
    globalTodos = loadTodos();
    displayCurrentDate();
    renderHomeTodoList(globalEvents, globalTodos);
    renderImportantMeetings(globalEvents);
    renderRecentMeetings(globalEvents);
};

// 홈 페이지 초기화
async function initHome() {
    console.log('🏠 홈 페이지 초기화 시작');
    console.log('📅 오늘 날짜:', formatDateString(todayOnlyDate));
    
    displayCurrentDate();
    
    globalEvents = loadEvents();
    globalTodos = loadTodos();
    
    console.log('📌 로드된 이벤트:', globalEvents.length, '개');
    console.log('✅ 로드된 TODO:', globalTodos.length, '개');
    
    const todayEvents = getEventsForDate(todayOnlyDate, globalEvents);
    console.log('🎯 오늘의 이벤트:', todayEvents.length, '개');
    
    renderHomeTodoList(globalEvents, globalTodos);
    renderImportantMeetings(globalEvents);
    renderRecentMeetings(globalEvents);

    // 사용자 정보 비동기로 가져와서 표시됨
    const user = await loadCurrentUser();
    console.log("✅ 불러온 사용자 정보:", user);

    console.log('✅ 홈 페이지 초기화 완료');
}

// 페이지 복귀 시 데이터 새로고침
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        console.log('🔄 [홈] 페이지 복귀 - 데이터 새로고침');
        window.refreshHomeData();
    }
});

// localStorage 변경 감지
window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY || e.key === TODO_STORAGE_KEY) {
        console.log('🔄 [홈] localStorage 변경 감지');
        window.refreshHomeData();
    }
});

// 페이지 로드 시 초기화
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHome);
} else {
    initHome();
}

// 회의록 관리 페이지로 이동
function goToMeetings() {
    window.location.href = 'meetings.html';
}

// 사용자 정보 로드 함수 (API에서만)
async function loadCurrentUser() {
  try {
    const response = await fetch('http://localhost:8080/api/auth/me', {
      credentials: 'include'  // 이 옵션만 있으면 브라우저가 HttpOnly 쿠키를 요청에 자동 포함!
    });
    if (response.ok) {
      const user = await response.json();
      displayUserName(user);
      return user;
    } else if (response.status === 401) {
      window.location.href = '/login.html';
      return null;
    } else {
      displayUserName(null);
      return null;
    }
  } catch (error) {
    console.error('네트워크 오류', error);
    displayUserName(null);
    return null;
  }
}

// 사용자 이름 표시
function displayUserName(user) {
    // 메인 헤더
    const nameElement = document.querySelector("#user-name");
    if (nameElement)
        nameElement.textContent = (user && user.name) || (user && user.email) || '사용자';

    // 사이드바 이름
    document.querySelectorAll(".user-name").forEach(el => {
        el.textContent = (user && user.name) || (user && user.email) || '사용자';
    });

    // 사이드바 이메일
    document.querySelectorAll(".user-email").forEach(el => {
        el.textContent = (user && user.email) || '';
    });

    // 사이드바 아바타 (선택)
    document.querySelectorAll(".user-avatar").forEach(el => {
        el.textContent = (user && user.name) ? user.name.charAt(0).toUpperCase() : "U";
    });
}

// DOMContentLoaded 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    loadCurrentUser();
    initHome();
});

// localStorage 변경 감지
window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY || e.key === TODO_STORAGE_KEY) {
        console.log('🔄 [홈] localStorage 변경 감지');
        window.refreshHomeData();
    }
});

// 회의록 관리 페이지 이동 함수
function goToMeetings() {
    window.location.href = 'meetings.html';
}
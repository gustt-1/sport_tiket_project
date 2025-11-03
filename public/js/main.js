// 全局变量
let currentUser = null;

// DOM加载完成后执行
document.addEventListener('DOMContentLoaded', () => {
    // 检查用户登录状态
    checkLoginStatus();
    
    // 导航菜单点击事件
    setupNavigation();
    
    // 表单提交事件
    setupForms();
    
    // 加载首页数据
    loadFeaturedEvents();
    
    // 设置管理员标签切换
    setupAdminTabs();
    
    // 设置模态框
    setupModal();
});

// 检查用户登录状态
function checkLoginStatus() {
    const user = localStorage.getItem('user');
    if (user) {
        currentUser = JSON.parse(user);
        updateUIForLoggedInUser();
    }
}

// 更新UI显示登录用户信息
function updateUIForLoggedInUser() {
    if (currentUser) {
        document.getElementById('login-nav').style.display = 'none';
        document.getElementById('register-nav').style.display = 'none';
        document.getElementById('logout-nav').style.display = 'block';
        document.getElementById('user-tickets-nav').style.display = 'block';
        
        if (currentUser.isAdmin) {
            document.getElementById('admin-nav').style.display = 'block';
        }
    } else {
        document.getElementById('login-nav').style.display = 'block';
        document.getElementById('register-nav').style.display = 'block';
        document.getElementById('logout-nav').style.display = 'none';
        document.getElementById('user-tickets-nav').style.display = 'none';
        document.getElementById('admin-nav').style.display = 'none';
    }
}

// 设置导航菜单
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.getAttribute('data-page');
            showPage(page);
            
            // 如果点击的是需要加载数据的页面，则加载相应数据
            if (page === 'events') {
                loadEvents();
            } else if (page === 'message-board') {
                loadMessages();
            } else if (page === 'user-tickets' && currentUser) {
                loadUserTickets();
            } else if (page === 'admin' && currentUser && currentUser.isAdmin) {
                loadAdminData();
            }
        });
    });
    
    // 退出登录按钮
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }
    
    // 返回赛事列表按钮
    const backToEventsBtn = document.getElementById('back-to-events-btn');
    if (backToEventsBtn) {
        backToEventsBtn.addEventListener('click', () => {
            showPage('events');
        });
    }
}

// 显示指定页面
function showPage(pageId) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
        page.classList.remove('active');
    });
    
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
    }
    
    // 更新导航菜单激活状态
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        if (link.getAttribute('data-page') === pageId) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// 设置表单提交事件
function setupForms() {
    // 登录表单
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('login-username').value;
            const password = document.getElementById('login-password').value;
            login(username, password);
        });
    }
    
    // 注册表单
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('register-username').value;
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            
            if (password !== confirmPassword) {
                showMessage('两次输入的密码不一致');
                return;
            }
            
            register(username, email, password);
        });
    }
    
    // 留言表单
    const messageForm = document.getElementById('message-form');
    if (messageForm) {
        messageForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            if (!currentUser) {
                showMessage('请先登录');
                showPage('login');
                return;
            }
            
            const content = document.getElementById('message-content').value;
            submitMessage(content);
        });
    }
    
    // 购票表单
    const purchaseForm = document.getElementById('purchase-form');
    if (purchaseForm) {
        purchaseForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            if (!currentUser) {
                showMessage('请先登录');
                showPage('login');
                return;
            }
            
            const eventId = document.getElementById('event-id').value;
            const seatType = document.getElementById('seat-type').value;
            const quantity = document.getElementById('ticket-quantity').value;
            
            purchaseTicket(eventId, seatType, quantity);
        });
    }
    
    // 添加场馆表单
    const addVenueForm = document.getElementById('add-venue-form');
    if (addVenueForm) {
        addVenueForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            if (!currentUser || !currentUser.isAdmin) {
                showMessage('权限不足');
                return;
            }
            
            const name = document.getElementById('venue-name').value;
            const location = document.getElementById('venue-location').value;
            const vipSeats = document.getElementById('vip-seats').value;
            const standardSeats = document.getElementById('standard-seats').value;
            const economySeats = document.getElementById('economy-seats').value;
            
            addVenue(name, location, vipSeats, standardSeats, economySeats);
        });
    }
    
    // 添加赛事表单
    const addEventForm = document.getElementById('add-event-form');
    if (addEventForm) {
        addEventForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            if (!currentUser || !currentUser.isAdmin) {
                showMessage('权限不足');
                return;
            }
            
            const name = document.getElementById('event-name').value;
            const type = document.getElementById('event-type').value;
            const organizer = document.getElementById('event-organizer').value;
            const organizerInfo = document.getElementById('organizer-info').value;
            const participants = document.getElementById('event-participants').value;
            const description = document.getElementById('event-description').value;
            const startTime = document.getElementById('event-start-time').value;
            const endTime = document.getElementById('event-end-time').value;
            const venueId = document.getElementById('event-venue').value;
            const vipPrice = document.getElementById('vip-price').value;
            const standardPrice = document.getElementById('standard-price').value;
            const economyPrice = document.getElementById('economy-price').value;
            const ticketSaleStart = document.getElementById('ticket-sale-start').value;
            const ticketSaleEnd = document.getElementById('ticket-sale-end').value;
            
            addEvent(name, type, organizer, organizerInfo, participants, description, 
                    startTime, endTime, venueId, vipPrice, standardPrice, economyPrice, 
                    ticketSaleStart, ticketSaleEnd);
        });
    }
    
    // 筛选赛事按钮
    const filterEventsBtn = document.getElementById('filter-events-btn');
    if (filterEventsBtn) {
        filterEventsBtn.addEventListener('click', () => {
            const type = document.getElementById('event-type-filter').value;
            loadEvents(type);
        });
    }
    
    // 座位类型和数量变化时更新价格
    const seatTypeSelect = document.getElementById('seat-type');
    const ticketQuantityInput = document.getElementById('ticket-quantity');
    
    if (seatTypeSelect && ticketQuantityInput) {
        seatTypeSelect.addEventListener('change', updateTicketPrice);
        ticketQuantityInput.addEventListener('input', updateTicketPrice);
    }
}

// 更新票价显示
function updateTicketPrice() {
    const eventDetailContent = document.getElementById('event-detail-content');
    if (!eventDetailContent.dataset.eventData) return;
    
    const eventData = JSON.parse(eventDetailContent.dataset.eventData);
    const seatType = document.getElementById('seat-type').value;
    const quantity = parseInt(document.getElementById('ticket-quantity').value) || 0;
    
    let price = 0;
    if (seatType === 'vip') {
        price = parseFloat(eventData.vip_price);
    } else if (seatType === 'standard') {
        price = parseFloat(eventData.standard_price);
    } else if (seatType === 'economy') {
        price = parseFloat(eventData.economy_price);
    }
    
    document.getElementById('ticket-price').textContent = price.toFixed(2);
    document.getElementById('total-price').textContent = (price * quantity).toFixed(2);
}

// 设置管理员标签切换
function setupAdminTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            
            // 更新按钮激活状态
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // 更新内容显示
            const tabContents = document.querySelectorAll('.admin-tab-content');
            tabContents.forEach(content => {
                content.classList.remove('active');
            });
            
            document.getElementById(tabId).classList.add('active');
        });
    });
}

// 设置模态框
function setupModal() {
    const modal = document.getElementById('message-modal');
    const closeModal = document.querySelector('.close-modal');
    
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// 显示消息
function showMessage(message) {
    const modal = document.getElementById('message-modal');
    const modalMessage = document.getElementById('modal-message');
    
    modalMessage.textContent = message;
    modal.style.display = 'block';
}

// API请求函数
async function apiRequest(url, method = 'GET', data = null) {
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        if (data) {
            options.body = JSON.stringify(data);
        }
        
        const response = await fetch(url, options);
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || '请求失败');
        }
        
        return result;
    } catch (error) {
        console.error('API请求错误:', error);
        showMessage(error.message);
        throw error;
    }
}

// 用户登录
async function login(username, password) {
    try {
        const result = await apiRequest('/api/users/login', 'POST', { username, password });
        
        // 保存用户信息到本地存储
        localStorage.setItem('user', JSON.stringify(result.user));
        currentUser = result.user;
        
        // 更新UI
        updateUIForLoggedInUser();
        
        showMessage('登录成功');
        showPage('home');
    } catch (error) {
        console.error('登录失败:', error);
        showMessage('登录失败: ' + (error.message || '请检查用户名和密码'));
    }
}

// 用户注册
async function register(username, email, password) {
    try {
        const result = await apiRequest('/api/users/register', 'POST', { username, email, password });
        
        showMessage('注册成功，请登录');
        showPage('login');
    } catch (error) {
        console.error('注册失败:', error);
        showMessage('注册失败: ' + (error.message || '请稍后再试'));
    }
}

// 用户退出登录
function logout() {
    apiRequest('/api/users/logout', 'POST')
        .then(() => {
            // 清除本地存储的用户信息
            localStorage.removeItem('user');
            currentUser = null;
            
            // 更新UI
            updateUIForLoggedInUser();
            
            showMessage('已退出登录');
            showPage('home');
        })
        .catch(error => {
            console.error('退出登录失败:', error);
            showMessage('退出登录失败，请稍后再试');
        });
}

// 加载热门赛事
function loadFeaturedEvents() {
    const featuredEventsList = document.getElementById('featured-events-list');
    
    apiRequest('/api/events')
        .then(events => {
            if (events.length === 0) {
                featuredEventsList.innerHTML = '<p>暂无赛事信息</p>';
                return;
            }
            
            // 只显示最多4个赛事
            const featuredEvents = events.slice(0, 4);
            
            let html = '';
            featuredEvents.forEach(event => {
                html += createEventCard(event);
            });
            
            featuredEventsList.innerHTML = html;
            
            // 添加查看详情按钮点击事件
            const viewDetailsBtns = featuredEventsList.querySelectorAll('.view-details');
            viewDetailsBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const eventId = btn.getAttribute('data-event-id');
                    viewEventDetails(eventId);
                });
            });
        })
        .catch(error => {
            console.error('加载热门赛事失败:', error);
            featuredEventsList.innerHTML = '<p>加载赛事信息失败</p>';
        });
}

// 加载所有赛事
function loadEvents(type = '') {
    const eventsList = document.getElementById('events-list');
    
    let url = '/api/events';
    if (type) {
        url += `?type=${encodeURIComponent(type)}`;
    }
    
    apiRequest(url)
        .then(events => {
            if (events.length === 0) {
                eventsList.innerHTML = '<p>暂无赛事信息</p>';
                return;
            }
            
            let html = '';
            events.forEach(event => {
                html += createEventCard(event);
            });
            
            eventsList.innerHTML = html;
            
            // 添加查看详情按钮点击事件
            const viewDetailsBtns = eventsList.querySelectorAll('.view-details');
            viewDetailsBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const eventId = btn.getAttribute('data-event-id');
                    viewEventDetails(eventId);
                });
            });
        })
        .catch(error => {
            console.error('加载赛事失败:', error);
            eventsList.innerHTML = '<p>加载赛事信息失败</p>';
        });
}

// 创建赛事卡片HTML
function createEventCard(event) {
    const startDate = new Date(event.start_time).toLocaleString();
    
    return `
        <div class="event-card">
            <span class="event-type">${event.type}</span>
            <h3>${event.name}</h3>
            <p><strong>时间：</strong>${startDate}</p>
            <p><strong>场馆：</strong>${event.venue_name}</p>
            <p><strong>地点：</strong>${event.venue_location}</p>
            <a href="#" class="view-details" data-event-id="${event.id}">查看详情</a>
        </div>
    `;
}

// 查看赛事详情
function viewEventDetails(eventId) {
    apiRequest(`/api/events?id=${eventId}`)
        .then(events => {
            if (events.length === 0) {
                showMessage('赛事信息不存在');
                return;
            }
            
            const event = events[0];
            const eventDetailContent = document.getElementById('event-detail-content');
            
            // 保存事件数据用于购票
            eventDetailContent.dataset.eventData = JSON.stringify(event);
            
            const startDate = new Date(event.start_time).toLocaleString();
            const endDate = new Date(event.end_time).toLocaleString();
            const saleStartDate = new Date(event.ticket_sale_start).toLocaleString();
            const saleEndDate = new Date(event.ticket_sale_end).toLocaleString();
            
            eventDetailContent.innerHTML = `
                <h3>${event.name}</h3>
                <div class="event-info">
                    <p><strong>赛事类型：</strong>${event.type}</p>
                    <p><strong>开始时间：</strong>${startDate}</p>
                    <p><strong>结束时间：</strong>${endDate}</p>
                    <p><strong>场馆：</strong>${event.venue_name}</p>
                    <p><strong>地点：</strong>${event.venue_location}</p>
                    <p><strong>组织者：</strong>${event.organizer}</p>
                    <p><strong>组织者简介：</strong>${event.organizer_info || '无'}</p>
                    <p><strong>参赛队伍/参赛队员：</strong>${event.participants}</p>
                    <p><strong>赛事简介：</strong>${event.description || '无'}</p>
                    <p><strong>票价信息：</strong></p>
                    <ul>
                        <li>贵宾座位：${event.vip_price} 元</li>
                        <li>标准座位：${event.standard_price} 元</li>
                        <li>低价座位：${event.economy_price} 元</li>
                    </ul>
                    <p><strong>售票时间：</strong>${saleStartDate} 至 ${saleEndDate}</p>
                </div>
            `;
            
            // 设置购票表单的事件ID
            document.getElementById('event-id').value = event.id;
            
            // 更新票价显示
            updateTicketPrice();
            
            // 显示赛事详情页面
            showPage('event-detail');
        })
        .catch(error => {
            console.error('获取赛事详情失败:', error);
            showMessage('获取赛事详情失败');
        });
}

// 购买票务
async function purchaseTicket(eventId, seatType, quantity) {
    try {
        const result = await apiRequest('/api/tickets', 'POST', {
            event_id: eventId,
            seat_type: seatType,
            quantity: parseInt(quantity)
        });
        
        showMessage(`购票成功，总价：${result.totalPrice} 元`);
        showPage('user-tickets');
        loadUserTickets();
    } catch (error) {
        console.error('购票失败:', error);
    }
}

// 加载用户票务
function loadUserTickets() {
    if (!currentUser) {
        showMessage('请先登录');
        showPage('login');
        return;
    }
    
    const userTicketsList = document.getElementById('user-tickets-list');
    
    apiRequest('/api/tickets/user')
        .then(tickets => {
            if (tickets.length === 0) {
                userTicketsList.innerHTML = '<p>暂无票务信息</p>';
                return;
            }
            
            let html = '';
            tickets.forEach(ticket => {
                const purchaseDate = new Date(ticket.purchase_time).toLocaleString();
                const eventDate = new Date(ticket.start_time).toLocaleString();
                
                let seatTypeText = '';
                if (ticket.seat_type === 'vip') {
                    seatTypeText = '贵宾座位';
                } else if (ticket.seat_type === 'standard') {
                    seatTypeText = '标准座位';
                } else if (ticket.seat_type === 'economy') {
                    seatTypeText = '低价座位';
                }
                
                html += `
                    <div class="ticket-card">
                        <h3>${ticket.event_name}</h3>
                        <div class="ticket-info">
                            <p><strong>赛事类型：</strong>${ticket.event_type}</p>
                            <p><strong>比赛时间：</strong>${eventDate}</p>
                            <p><strong>场馆：</strong>${ticket.venue_name}</p>
                            <p><strong>地点：</strong>${ticket.venue_location}</p>
                            <p><strong>座位类型：</strong>${seatTypeText}</p>
                            <p><strong>数量：</strong>${ticket.quantity}</p>
                            <p><strong>总价：</strong>${ticket.total_price} 元</p>
                            <p><strong>购买时间：</strong>${purchaseDate}</p>
                        </div>
                        <span class="ticket-status ${ticket.status === 'active' ? 'status-active' : 'status-cancelled'}">
                            ${ticket.status === 'active' ? '有效' : '已取消'}
                        </span>
                        ${ticket.status === 'active' ? 
                            `<button class="cancel-ticket" data-ticket-id="${ticket.id}">取消订票</button>` : ''}
                    </div>
                `;
            });
            
            userTicketsList.innerHTML = html;
            
            // 添加取消订票按钮点击事件
            const cancelTicketBtns = userTicketsList.querySelectorAll('.cancel-ticket');
            cancelTicketBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    const ticketId = btn.getAttribute('data-ticket-id');
                    cancelTicket(ticketId);
                });
            });
        })
        .catch(error => {
            console.error('加载用户票务失败:', error);
            userTicketsList.innerHTML = '<p>加载票务信息失败</p>';
        });
}

// 取消订票
async function cancelTicket(ticketId) {
    try {
        const result = await apiRequest(`/api/tickets/${ticketId}/cancel`, 'PUT');
        
        showMessage('取消订票成功');
        loadUserTickets();
    } catch (error) {
        console.error('取消订票失败:', error);
    }
}

// 加载留言
function loadMessages() {
    const messagesList = document.getElementById('messages-list');
    
    apiRequest('/api/messages')
        .then(messages => {
            if (messages.length === 0) {
                messagesList.innerHTML = '<p>暂无留言</p>';
                return;
            }
            
            let html = '';
            messages.forEach(message => {
                const date = new Date(message.created_at).toLocaleString();
                
                html += `
                    <div class="message-card" data-message-id="${message.id}">
                        <div class="message-header">
                            <span><strong>${message.username}</strong> 发表于 ${date}</span>
                            ${currentUser && currentUser.isAdmin ? 
                                `<button class="delete-btn delete-message" data-message-id="${message.id}">删除</button>` : ''}
                        </div>
                        <div class="message-content">
                            ${message.content}
                        </div>
                    </div>
                `;
            });
            
            messagesList.innerHTML = html;
            
            // 添加删除留言按钮点击事件（管理员）
            if (currentUser && currentUser.isAdmin) {
                const deleteMessageBtns = messagesList.querySelectorAll('.delete-message');
                deleteMessageBtns.forEach(btn => {
                    btn.addEventListener('click', () => {
                        const messageId = btn.getAttribute('data-message-id');
                        deleteMessage(messageId);
                    });
                });
            }
        })
        .catch(error => {
            console.error('加载留言失败:', error);
            messagesList.innerHTML = '<p>加载留言失败</p>';
        });
}

// 提交留言
async function submitMessage(content) {
    try {
        const result = await apiRequest('/api/messages', 'POST', { content });
        
        showMessage('留言成功');
        document.getElementById('message-content').value = '';
        loadMessages();
    } catch (error) {
        console.error('提交留言失败:', error);
    }
}

// 删除留言（管理员）
async function deleteMessage(messageId) {
    if (!currentUser || !currentUser.isAdmin) {
        showMessage('权限不足');
        return;
    }
    
    try {
        const result = await apiRequest(`/api/messages/${messageId}`, 'DELETE');
        
        showMessage('删除留言成功');
        loadMessages();
    } catch (error) {
        console.error('删除留言失败:', error);
    }
}

// 加载管理员数据
function loadAdminData() {
    if (!currentUser || !currentUser.isAdmin) {
        showMessage('权限不足');
        return;
    }
    
    // 加载场馆列表
    loadVenues();
    
    // 加载赛事列表（管理员视图）
    loadAdminEvents();
    
    // 加载用户列表
    loadUsers();
    
    // 加载留言列表（管理员视图）
    loadAdminMessages();
}

// 加载场馆列表
function loadVenues() {
    const venuesList = document.getElementById('venues-list');
    const eventVenueSelect = document.getElementById('event-venue');
    
    apiRequest('/api/venues')
        .then(venues => {
            // 更新场馆列表
            if (venues.length === 0) {
                venuesList.innerHTML = '<p>暂无场馆信息</p>';
            } else {
                let html = '';
                venues.forEach(venue => {
                    html += `
                        <div class="admin-list-item">
                            <h4>${venue.name}</h4>
                            <p><strong>地点：</strong>${venue.location}</p>
                            <p><strong>贵宾座位：</strong>${venue.vip_seats}</p>
                            <p><strong>标准座位：</strong>${venue.standard_seats}</p>
                            <p><strong>低价座位：</strong>${venue.economy_seats}</p>
                        </div>
                    `;
                });
                venuesList.innerHTML = html;
            }
            
            // 更新赛事添加表单中的场馆选择
            if (eventVenueSelect) {
                eventVenueSelect.innerHTML = '';
                venues.forEach(venue => {
                    const option = document.createElement('option');
                    option.value = venue.id;
                    option.textContent = venue.name;
                    eventVenueSelect.appendChild(option);
                });
            }
        })
        .catch(error => {
            console.error('加载场馆信息失败:', error);
            venuesList.innerHTML = '<p>加载场馆信息失败</p>';
        });
}

// 添加场馆
async function addVenue(name, location, vipSeats, standardSeats, economySeats) {
    try {
        const result = await apiRequest('/api/venues', 'POST', {
            name,
            location,
            vip_seats: parseInt(vipSeats),
            standard_seats: parseInt(standardSeats),
            economy_seats: parseInt(economySeats)
        });
        
        showMessage('添加场馆成功');
        
        // 重置表单
        document.getElementById('venue-name').value = '';
        document.getElementById('venue-location').value = '';
        document.getElementById('vip-seats').value = '';
        document.getElementById('standard-seats').value = '';
        document.getElementById('economy-seats').value = '';
        
        // 重新加载场馆列表
        loadVenues();
    } catch (error) {
        console.error('添加场馆失败:', error);
    }
}

// 加载赛事列表（管理员视图）
function loadAdminEvents() {
    const adminEventsList = document.getElementById('admin-events-list');
    
    apiRequest('/api/events')
        .then(events => {
            if (events.length === 0) {
                adminEventsList.innerHTML = '<p>暂无赛事信息</p>';
                return;
            }
            
            let html = '';
            events.forEach(event => {
                const startDate = new Date(event.start_time).toLocaleString();
                const endDate = new Date(event.end_time).toLocaleString();
                
                html += `
                    <div class="admin-list-item">
                        <h4>${event.name}</h4>
                        <p><strong>类型：</strong>${event.type}</p>
                        <p><strong>时间：</strong>${startDate} 至 ${endDate}</p>
                        <p><strong>场馆：</strong>${event.venue_name}</p>
                        <p><strong>组织者：</strong>${event.organizer}</p>
                        <p><strong>票价：</strong>贵宾 ${event.vip_price} 元，标准 ${event.standard_price} 元，低价 ${event.economy_price} 元</p>
                    </div>
                `;
            });
            
            adminEventsList.innerHTML = html;
        })
        .catch(error => {
            console.error('加载赛事信息失败:', error);
            adminEventsList.innerHTML = '<p>加载赛事信息失败</p>';
        });
}

// 添加赛事
async function addEvent(name, type, organizer, organizerInfo, participants, description, 
                      startTime, endTime, venueId, vipPrice, standardPrice, economyPrice, 
                      ticketSaleStart, ticketSaleEnd) {
    try {
        const result = await apiRequest('/api/events', 'POST', {
            name,
            type,
            organizer,
            organizer_info: organizerInfo,
            participants,
            description,
            start_time: startTime,
            end_time: endTime,
            venue_id: parseInt(venueId),
            vip_price: parseFloat(vipPrice),
            standard_price: parseFloat(standardPrice),
            economy_price: parseFloat(economyPrice),
            ticket_sale_start: ticketSaleStart,
            ticket_sale_end: ticketSaleEnd
        });
        
        showMessage('添加赛事成功');
        
        // 重置表单
        document.getElementById('add-event-form').reset();
        
        // 重新加载赛事列表
        loadAdminEvents();
    } catch (error) {
        console.error('添加赛事失败:', error);
    }
}

// 加载用户列表
function loadUsers() {
    const usersList = document.getElementById('users-list');
    
    apiRequest('/api/users')
        .then(users => {
            if (users.length === 0) {
                usersList.innerHTML = '<p>暂无用户信息</p>';
                return;
            }
            
            let html = '';
            users.forEach(user => {
                const registerDate = new Date(user.created_at).toLocaleString();
                
                html += `
                    <div class="admin-list-item">
                        <h4>${user.username}</h4>
                        <p><strong>邮箱：</strong>${user.email}</p>
                        <p><strong>注册时间：</strong>${registerDate}</p>
                        <p><strong>用户类型：</strong>${user.is_admin ? '管理员' : '普通用户'}</p>
                    </div>
                `;
            });
            
            usersList.innerHTML = html;
        })
        .catch(error => {
            console.error('加载用户信息失败:', error);
            usersList.innerHTML = '<p>加载用户信息失败</p>';
        });
}

// 加载留言列表（管理员视图）
function loadAdminMessages() {
    const adminMessagesList = document.getElementById('admin-messages-list');
    
    apiRequest('/api/messages')
        .then(messages => {
            if (messages.length === 0) {
                adminMessagesList.innerHTML = '<p>暂无留言</p>';
                return;
            }
            
            let html = '';
            messages.forEach(message => {
                const date = new Date(message.created_at).toLocaleString();
                
                html += `
                    <div class="admin-list-item">
                        <h4>${message.username}</h4>
                        <p><strong>时间：</strong>${date}</p>
                        <p><strong>内容：</strong>${message.content}</p>
                        <div class="admin-actions">
                            <button class="delete-btn delete-admin-message" data-message-id="${message.id}">删除留言</button>
                        </div>
                    </div>
                `;
            });
            
            adminMessagesList.innerHTML = html;
            
            // 添加删除留言按钮点击事件
            const deleteMessageBtns = adminMessagesList.querySelectorAll('.delete-admin-message');
            deleteMessageBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    const messageId = btn.getAttribute('data-message-id');
                    deleteMessage(messageId);
                });
            });
        })
        .catch(error => {
            console.error('加载留言失败:', error);
            adminMessagesList.innerHTML = '<p>加载留言失败</p>';
        });
}
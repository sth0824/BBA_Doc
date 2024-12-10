document.addEventListener("DOMContentLoaded", function () {
    // Kakao 초기화 함수
    function initializeKakao() {
        if (!Kakao.isInitialized()) {
            const kakaoAppKey = document.querySelector('meta[name="kakao-app-key"]').content;
            Kakao.init(kakaoAppKey);
        }
    }

    initializeKakao();

    // 기존 웹사이트 관련 변수들
    const loginLink = document.getElementById("login-link");
    const logoutMenu = document.getElementById("logout-menu");
    const logoutLink = document.getElementById("logout-link");
    const userProfile = document.getElementById("user-profile");
    const loginErrorModal = document.getElementById("loginErrorModal");
    const closeLoginError = loginErrorModal.querySelector(".close");
    const retryBtn = loginErrorModal.querySelector(".retry-btn");
    const myInfoModal = document.getElementById('myInfoModal');
    const myInfoLink = document.getElementById('myinfo-link');
    const closeMyInfo = document.getElementById('closeMyInfo');

    // 쿠키 관련 유틸리티 함수들
    const CookieUtil = {
        setCookie(name, value, days) {
            const expires = new Date();
            expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
            document.cookie = `${name}=${JSON.stringify(value)};expires=${expires.toUTCString()};path=/`;
        },

        getCookie(name) {
            const nameEQ = `${name}=`;
            const ca = document.cookie.split(';');
            for (let i = 0; i < ca.length; i++) {
                let c = ca[i];
                while (c.charAt(0) === ' ') c = c.substring(1, c.length);
                if (c.indexOf(nameEQ) === 0) {
                    try {
                        return JSON.parse(c.substring(nameEQ.length, c.length));
                    } catch (e) {
                        return null;
                    }
                }
            }
            return null;
        },

        deleteCookie(name) {
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:01 GMT;path=/`;
        }
    };

    // 즐겨찾기 관리 클래스
    class FavoritesManager {
        constructor() {
            this.favorites = CookieUtil.getCookie('favorites') || [];
            this.init();
        }

        init() {
            this.initializeEventListeners();
            this.updateFavoriteButtons();
            this.renderFavorites();
        }

        initializeEventListeners() {
            // 즐겨찾기 버튼 이벤트 리스너
            document.querySelectorAll('.favorite-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const card = btn.closest('.hospital-card');
                    const hospitalId = btn.dataset.hospitalId;
                    const hospitalData = this.getHospitalData(card);

                    if (this.isFavorite(hospitalId)) {
                        this.removeFavorite(hospitalId);
                    } else {
                        this.addFavorite(hospitalId, hospitalData);
                    }
                });
            });

            // 뷰 토글 버튼 이벤트 리스너
            document.querySelectorAll('.view-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const view = btn.dataset.view;
                    this.toggleView(view);
                });
            });
        }

        // 병원 데이터 추출
        getHospitalData(card) {
            const hospitalName = card.querySelector('.hospital-name')?.textContent;
            const favoriteBtn = card.querySelector('.favorite-btn');
            
            console.log('Getting hospital data:', {
                name: hospitalName,
                id: favoriteBtn?.dataset.hospitalId
            }); // 디버깅용
            
            return {
                id: favoriteBtn?.dataset.hospitalId,
                name: hospitalName || '병원 이름 없음',
                details: Array.from(card.querySelectorAll('.hospital-details'))
                    .map(el => el.textContent),
                rating: card.querySelector('.rating')?.textContent
            };
        }
    }

    // 카카오 로그인 상태 확인 및 UI 업데이트 함수
    function updateLoginState() {
        try {
            if (!Kakao.isInitialized()) {
                console.log("카카오 초기화되지 않음");
                return;
            }
            
            const token = localStorage.getItem('kakao_access_token');
            if (!token) {
                console.log("액세스 토큰 없음");
                return;
            }

            Kakao.Auth.setAccessToken(token);
            
            Kakao.API.request({
                url: '/v2/user/me',
            })
            .then(function(response) {
                console.log("사용자 정보:", response);
                
                // 프로필 정보 업데이트
                const nickname = response.properties.nickname;
                const profileImage = response.properties.profile_image;
                
                userProfile.innerHTML = `
                    <img src="${profileImage}" alt="프로필" class="profile-image">
                    <span>${nickname}</span>
                `;
                
                // UI 상태 변경
                loginLink.style.display = "none";
                logoutMenu.style.display = "block";
                
                // 사용자 정보 저장
                CookieUtil.setCookie('userInfo', {
                    nickname: nickname,
                    profileImage: profileImage
                }, 7);
            })
            .catch(function(error) {
                console.error("사용자 정보 요청 실패:", error);
                handleLogout(); // 오류 발생시 로그아웃 처리
            });
        } catch (error) {
            console.error("로그인 상태 체크 중 에러:", error);
            console.error(error.stack);
        }
    }

    // FavoritesManager 클래스의 메서드들
    Object.assign(FavoritesManager.prototype, {
        isFavorite(hospitalId) {
            return this.favorites.some(fav => fav.id === hospitalId);
        },

        addFavorite(hospitalId, hospitalData) {
            if (!this.isFavorite(hospitalId)) {
                this.favorites.push(hospitalData);
                this.saveToStorage();
                this.updateFavoriteButtons();
                this.renderFavorites();
                this.showToast('즐겨찾기에 추가되었습니다.');
            }
        },

        removeFavorite(hospitalId) {
            this.favorites = this.favorites.filter(fav => fav.id !== hospitalId);
            this.saveToStorage();
            this.updateFavoriteButtons();
            this.renderFavorites();
            this.showToast('겨찾기가 해제되었습니다.');
        },

        saveToStorage() {
            CookieUtil.setCookie('favorites', this.favorites, 30); // 30일 유효
        },

        updateFavoriteButtons() {
            document.querySelectorAll('.favorite-btn').forEach(btn => {
                const hospitalId = btn.dataset.hospitalId;
                const heartIcon = btn.querySelector('.heart-icon');
                if (this.isFavorite(hospitalId)) {
                    heartIcon.classList.add('active');
                } else {
                    heartIcon.classList.remove('active');
                }
            });
        },

        renderFavorites() {
            const container = document.getElementById('favorite-hospitals');
            
            if (this.favorites.length === 0) {
                container.innerHTML = `
                    <div class="no-favorites">
                        아직 즐겨찾기한 병원이 없습니다.
                        <br>
                        병원 카드의 하트 아이콘을 클클릭하여 즐겨찾기에 추가해보세요!
                    </div>`;
                return;
            }

            console.log('Favorites data:', this.favorites); // 디버깅용

            container.innerHTML = this.favorites.map(hospital => {
                console.log('Hospital data:', hospital); // 디버깅용
                return `
                    <div class="favorite-hospital-card">
                        <div class="favorite-hospital-info">
                            <div class="favorite-hospital-header">
                                <h4 class="favorite-hospital-name">${hospital.name || '병원 이름 없음'}</h4>
                                <button class="remove-favorite" data-hospital-id="${hospital.id}">
                                    <svg viewBox="0 0 24 24" width="20" height="20">
                                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
                                    </svg>
                                </button>
                            </div>
                            ${hospital.details ? hospital.details.map(detail => 
                                `<p class="favorite-hospital-details">${detail}</p>`
                            ).join('') : ''}
                        </div>
                    </div>
                `;
            }).join('');

            // 삭제 버튼 이벤트 리스너 추가
            container.querySelectorAll('.remove-favorite').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const hospitalId = btn.dataset.hospitalId;
                    this.removeFavorite(hospitalId);
                });
            });
        },

        toggleView(view) {
            const container = document.getElementById('favorite-hospitals');
            const buttons = document.querySelectorAll('.view-btn');
            
            buttons.forEach(btn => {
                if (btn.dataset.view === view) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });

            container.classList.remove('grid-view', 'list-view');
            container.classList.add(`${view}-view`);
            this.renderFavorites();
        },

        showToast(message) {
            const toast = document.createElement('div');
            toast.className = 'toast-message';
            toast.textContent = message;
            document.body.appendChild(toast);

            setTimeout(() => {
                toast.classList.add('show');
                setTimeout(() => {
                    toast.classList.remove('show');
                    setTimeout(() => {
                        document.body.removeChild(toast);
                    }, 300);
                }, 2000);
            }, 100);
        }
    });

    // 즐겨찾기 매니저 인스턴스 생성
    const favoritesManager = new FavoritesManager();

    // 카카오 로그인 관련 함수들
    loginLink.addEventListener("click", function(e) {
        e.preventDefault();
        console.log("로그인 시도");  // 디버깅용
        
        try {
            Kakao.Auth.authorize({
                redirectUri: 'https://bba-doc-1.onrender.com/oauth',
                scope: 'profile_nickname, profile_image'
            });
        } catch (error) {
            console.error("카카오 로그인 에러:", error);
            loginErrorModal.style.display = "block";
        }
    });

    // 로그아웃 처리
    function handleLogout() {
        if (Kakao.Auth.getAccessToken()) {
            Kakao.Auth.logout();
        }
        loginLink.innerHTML = `
            <img src="https://k.kakaocdn.net/14/dn/btroDszwNrM/I6efHub1SN5KCJqLm1Ovx1/o.jpg" 
                 alt="카카오 로그인" 
                 class="kakao-login-image">
            로그인
        `;
        logoutMenu.style.display = "none";
        userProfile.textContent = "";
        myInfoModal.style.display = "none";
        
        // 내 정보 섹션 초기화
        updateMyInfoSection(null);
    }

    logoutLink.addEventListener("click", function(e) {
        e.preventDefault();
        try {
            if (Kakao.Auth.getAccessToken()) {
                Kakao.Auth.logout()
                    .then(function() {
                        // 로그아웃 처리
                        localStorage.removeItem('kakao_access_token');
                        localStorage.removeItem('user_info');
                        CookieUtil.deleteCookie('userInfo');
                        loginLink.style.display = "block";
                        logoutMenu.style.display = "none";
                        userProfile.innerHTML = '';
                        console.log("로그아웃 성공");
                    })
                    .catch(function(error) {
                        console.error("로그아웃 실패:", error);
                    });
            }
        } catch (error) {
            console.error("로그아웃 처리 중 에러:", error);
        }
    });

    // 초기 로그인 상태 확인
    updateLoginState();

    // 내 정보 모달 관련 코드
    myInfoLink.addEventListener('click', function(e) {
        e.preventDefault();
        if (!Kakao.Auth.getAccessToken()) {
            // 로그인되지 않은 경우 카카오 로그인 실행
            loginLink.click();
            return;
        }
        myInfoModal.style.display = 'block';
        // 즐겨찾기 목록 새로고침
        favoritesManager.renderFavorites();
    });

    closeMyInfo.addEventListener('click', function() {
        myInfoModal.style.display = 'none';
    });

    // 내 정보 섹션 업데이트 함수
    function updateMyInfoSection(userInfo) {
        const profileImage = document.getElementById('profile-image');
        const profileName = document.getElementById('profile-name');
        const profileEmail = document.getElementById('profile-email');

        if (userInfo) {
            profileImage.src = userInfo.thumbnail_image || '/api/placeholder/150/150';
            profileName.textContent = userInfo.nickname || '사용';
            profileEmail.textContent = userInfo.email || '';
        } else {
            profileImage.src = '/api/placeholder/150/150';
            profileName.textContent = '로그인이 필요합니다';
            profileEmail.textContent = '';
        }
    }

    // 에러 모달 관련
    closeLoginError.addEventListener("click", function() {
        loginErrorModal.style.display = "none";
    });

    retryBtn.addEventListener("click", function() {
        loginErrorModal.style.display = "none";
        loginLink.click();
    });

    // 모달 외부 클릭시 닫기
    window.addEventListener("click", function(event) {
        if (event.target === loginErrorModal) {
            loginErrorModal.style.display = "none";
        }
        if (event.target === myInfoModal) {
            myInfoModal.style.display = 'none';
        }
    });

    // 챗팅 관련 변수들
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const chatSend = document.getElementById('chat-send');
    const connectionStatus = document.getElementById('connection-status');
    const loadingIndicator = document.getElementById('loading-indicator');
    const chatToggle = document.getElementById('chat-toggle');
    const chatContainer = document.getElementById('chat-container');

    let ws = null;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    const reconnectDelay = 3000;

    // 채팅창 토글 기능
    chatToggle.addEventListener('click', function() {
        if (chatContainer.classList.contains('minimized')) {
            chatContainer.classList.remove('minimized');
            chatToggle.textContent = '−';
        } else {
            chatContainer.classList.add('minimized');
            chatToggle.textContent = '+';
        }
    });

    // 웹소켓 연결 함수
    function connectWebSocket() {
        if (ws && ws.readyState === WebSocket.OPEN) {
            console.log('WebSocket already connected');
            return;
        }

        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${wsProtocol}//${window.location.host}/ws`;
        ws = new WebSocket(wsUrl);
        updateConnectionStatus('연결 중...', '#FFA500');
        
        ws.onopen = function() {
            console.log('WebSocket Connected');
            updateConnectionStatus('연결됨', '#4CAF50');
            enableChatInterface();
            reconnectAttempts = 0;
        };

        ws.onclose = function() {
            console.log('WebSocket Disconnected');
            disableChatInterface();
            handleReconnect();
        };

        ws.onerror = function(error) {
            console.error('WebSocket Error:', error);
            updateConnectionStatus('연결 오류', '#FF0000');
            disableChatInterface();
        };

        ws.onmessage = function(event) {
            try {
                const response = JSON.parse(event.data);
                hideLoading();
                enableChatInterface();
                
                if (response.answer) {
                    addMessage(response.answer, 'bot');
                }
                
                chatMessages.scrollTop = chatMessages.scrollHeight;
            } catch (error) {
                console.error('Error processing message:', error);
                hideLoading();
                enableChatInterface();
                addMessage('죄송합니다. 오류가 발생했습니다.', 'bot');
            }
        };
    }

    function updateConnectionStatus(message, color) {
        connectionStatus.textContent = message;
        connectionStatus.style.color = color;
    }

    function handleReconnect() {
        if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            updateConnectionStatus(`재연결 시도 중... (${reconnectAttempts}/${maxReconnectAttempts})`, '#FFA500');
            setTimeout(connectWebSocket, reconnectDelay);
        } else {
            updateConnectionStatus('연결 실패', '#FF0000');
            addMessage('서버와의 연결이 끊어졌습니다. 페이지를 ��로고침해 주세요.', 'bot');
        }
    }

    function enableChatInterface() {
        chatInput.disabled = false;
        chatSend.disabled = false;
        chatInput.placeholder = "메시지를 입력하세요...";
    }

    function disableChatInterface() {
        chatInput.disabled = true;
        chatSend.disabled = true;
        chatInput.placeholder = "연결 중...";
    }

    function showLoading() {
        loadingIndicator.style.display = 'block';
        chatInput.disabled = true;
        chatSend.disabled = true;
    }

    function hideLoading() {
        loadingIndicator.style.display = 'none';
        chatInput.disabled = false;
        chatSend.disabled = false;
    }

    // 메시지 전송 함수
    function sendMessage() {
        const message = chatInput.value.trim();
        if (message && ws && ws.readyState === WebSocket.OPEN) {
            addMessage(message, 'user');
            
            try {
                ws.send(JSON.stringify({ message: message }));
                chatInput.value = '';
                showLoading();
            } catch (error) {
                console.error('Error sending message:', error);
                addMessage('메시지 전송에 실패했습니다.', 'bot');
                hideLoading();
            }
            
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }

    // 메시지 추가 함수
    function addMessage(content, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = content;
        
        messageDiv.appendChild(contentDiv);
        chatMessages.appendChild(messageDiv);
    }

    // 채팅 이벤트 리스너
    chatSend.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // 카카오맵 기화
    const mapContainer = document.getElementById("map");
    const options = {
        center: new kakao.maps.LatLng(33.450701, 126.570667),
        level: 5,
    };
    const map = new kakao.maps.Map(mapContainer, options);

    // 위치 기반 서비스
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            const locPosition = new kakao.maps.LatLng(lat, lon);
            map.setCenter(locPosition);
            
            const imageSrc = 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png';
            const imageSize = new kakao.maps.Size(24, 35);
            const markerImage = new kakao.maps.MarkerImage(imageSrc, imageSize);

            const currentLocationMarker = new kakao.maps.Marker({
                map: map,
                position: locPosition,
                image: markerImage
            });

            const currentLocationInfo = new kakao.maps.InfoWindow({
                content: '<div style="padding:5px;">현재 위치</div>'
            });

            const ps = new kakao.maps.services.Places();
            
            // 주변 병 검색
            ps.keywordSearch(
                "병원",
                function (data, status) {
                    if (status === kakao.maps.services.Status.OK) {
                        displayHospitals(data);
                    }
                },
                {
                    location: locPosition,
                    radius: 5000,
                }
            );
        });
    } else {
        alert("현재 위치를 불러올 수 없습니다.");
    }

    // 병원 정보 표시
    function displayHospitals(hospitals) {
        const hospitalsGrid = document.querySelector(".hospitals-grid");
        hospitalsGrid.innerHTML = "";

        hospitals.forEach(function (hospital) {
            const hospitalCard = document.createElement("div");
            hospitalCard.classList.add("hospital-card");

            hospitalCard.innerHTML = `
                <div class="hospital-info">
                    <div class="hospital-header">
                        <h3 class="hospital-name">${hospital.place_name}</h3>
                        <button class="favorite-btn" data-hospital-id="${hospital.id}" data-hospital-name="${hospital.place_name}">
                            <svg class="heart-icon" viewBox="0 0 24 24" width="24" height="24">
                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                            </svg>
                        </button>
                    </div>
                    <p class="hospital-details">${hospital.road_address_name || hospital.address_name}</p>
                    <p class="hospital-details">전화번호: ${hospital.phone || '정보없음'}</p>
                    <div class="rating">★★★★☆ ${(Math.random() * (5 - 3.5) + 3.5).toFixed(1)}</div>
                </div>
            `;
            hospitalsGrid.appendChild(hospitalCard);
            displayMarker(hospital);
        });

        favoritesManager.initializeEventListeners();
        favoritesManager.updateFavoriteButtons();
        setupSlider();
    }

    // 마커 표시
    function displayMarker(place) {
        const marker = new kakao.maps.Marker({
            map: map,
            position: new kakao.maps.LatLng(place.y, place.x),
        });

        kakao.maps.event.addListener(marker, "click", function () {
            const infowindow = new kakao.maps.InfoWindow({
                content: `
                    <div style="padding:10px;min-width:200px;">
                        <h4 style="margin-bottom:5px;">${place.place_name}</h4>
                        <p style="margin:0;font-size:13px;">
                            ${place.road_address_name || place.address_name}
                        </p>
                        <p style="margin:5px 0 0;font-size:13px;">
                            ${place.phone || '전화번호 없음'}
                        </p>
                    </div>
                `
            });
            infowindow.open(map, marker);
        });
    }

    // 슬라이더 설정
    function setupSlider() {
        const items = document.querySelectorAll(".hospital-card");
        const totalItems = items.length;
        let currentIndex = 0;
        const itemsPerView = 3;
        const itemWidth = items[0].offsetWidth + parseInt(window.getComputedStyle(items[0]).marginRight);

        function moveSlider(index) {
            const slider = document.querySelector(".hospitals-grid");
            slider.style.transform = `translateX(-${itemWidth * index}px)`;
        }

        document.querySelector(".prev-btn").addEventListener("click", function () {
            if (currentIndex > 0) {
                currentIndex--;
                moveSlider(currentIndex);
            }
        });

        document.querySelector(".next-btn").addEventListener("click", function () {
            if (currentIndex < totalItems - itemsPerView) {
                currentIndex++;
                moveSlider(currentIndex);
            }
        });

        window.addEventListener("resize", function () {
            moveSlider(currentIndex);
        });
    }

    // 웹소켓 연결 초기화
    connectWebSocket();

    // 전역 변수 선언
    let markers = [];
    let currentInfoWindow = null;
    let userLocation = null; // 사용자 위치 저장 변수

    // 사용자 위치 가져오기
    function getUserLocation() {
        return new Promise((resolve, reject) => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        userLocation = {
                            lat: position.coords.latitude,
                            lng: position.coords.longitude
                        };
                        console.log('사용자 위치:', userLocation);
                        resolve(userLocation);
                    },
                    (error) => {
                        console.error('위치 가져오기 실패:', error);
                        reject(error);
                    }
                );
            } else {
                reject(new Error('위치 서비스가 지원되지 않습니다.'));
            }
        });
    }

    // 검색 요소 가져오기
    const searchInput = document.querySelector('.search-input');
    const searchBtn = document.querySelector('.search-btn');

    if (searchBtn && searchInput) {
        // 검색 버튼 클릭 이벤트
        searchBtn.addEventListener('click', async function() {
            const keyword = searchInput.value.trim();
            if (keyword) {
                try {
                    // 위치 정보가 없으면 가져오기
                    if (!userLocation) {
                        await getUserLocation();
                    }
                    searchByDepartment(keyword);
                } catch (error) {
                    alert('위치 정보를 가져올 수 없습니다. 위치 서비스를 허용해주세요.');
                }
            }
        });

        // 엔터키 검색 이벤트
        searchInput.addEventListener('keypress', async function(e) {
            if (e.key === 'Enter') {
                const keyword = this.value.trim();
                if (keyword) {
                    try {
                        if (!userLocation) {
                            await getUserLocation();
                        }
                        searchByDepartment(keyword);
                    } catch (error) {
                        alert('위치 정보를 가져올 수 없습니다. 위치 서비스를 허용해주세요.');
                    }
                }
            }
        });
    }

    // 진료과목 검색 함수
    function searchByDepartment(keyword) {
        // 기존 마커 제거
        markers.forEach(marker => marker.setMap(null));
        markers = [];
        
        const ps = new kakao.maps.services.Places();
        const searchTerm = keyword + " 병원";

        // 검색 옵션 설정 (20km = 20000m)
        const searchOption = {
            location: new kakao.maps.LatLng(userLocation.lat, userLocation.lng),
            radius: 20000,
            sort: kakao.maps.services.SortBy.DISTANCE // 거리순 정렬
        };

        ps.keywordSearch(searchTerm, function(result, status) {
            if (status === kakao.maps.services.Status.OK) {
                // 현재 위치 마커 표시
                const currentLocationMarker = new kakao.maps.Marker({
                    map: map,
                    position: new kakao.maps.LatLng(userLocation.lat, userLocation.lng),
                    image: new kakao.maps.MarkerImage(
                        'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png',
                        new kakao.maps.Size(24, 35)
                    )
                });
                markers.push(currentLocationMarker);

                // 검색 결과 표시
                displayHospitals(result);
                
                // 지도 범위 재설정
                const bounds = new kakao.maps.LatLngBounds();
                bounds.extend(new kakao.maps.LatLng(userLocation.lat, userLocation.lng)); // 현재 위치 포함
                result.forEach(place => {
                    bounds.extend(new kakao.maps.LatLng(place.y, place.x));
                });
                map.setBounds(bounds);
                
                // 지도 섹션으로 스크롤
                const mapSection = document.getElementById('map-section');
                if (mapSection) {
                    mapSection.scrollIntoView({ 
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            } else {
                alert('검색 결과가 없습니다.');
            }
        }, searchOption);
    }

    // 초기 위치 정보 가져오기
    getUserLocation().catch(error => {
        console.error('초기 위치 정보 가져오기 실패:', error);
    });

    // 쿠키 설정 함수
    function setCookie(name, value, days) {
        let expires = "";
        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Strict";
    }

    // 카카오 로그인 관련 설정
    Kakao.Auth.setAccessToken(localStorage.getItem('kakao_access_token'));

    // 카카오맵 기화 함수
    function initializeMap() {
        if (typeof kakao !== 'undefined' && kakao.maps) {
            const mapContainer = document.getElementById("map");
            const options = {
                center: new kakao.maps.LatLng(33.450701, 126.570667),
                level: 5,
            };
            const map = new kakao.maps.Map(mapContainer, options);
            // 나머지 맵 관련 코드...
        } else {
            // 카카오맵 SDK가 아직 로드되지 않은 경우 재시도
            setTimeout(initializeMap, 100);
        }
    }

    // 맵 초기화 시작
    initializeMap();
});
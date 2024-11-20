document.addEventListener("DOMContentLoaded", function () {
    // 카카오 초기화
    Kakao.init('0aa4cfc2bf90651f45f4870aeeacb99b'); // 여기에 JavaScript 키를 넣어주세요

    // 기존 웹사이트 관련 변수들
    const loginLink = document.getElementById("login-link");
    const logoutMenu = document.getElementById("logout-menu");
    const logoutLink = document.getElementById("logout-link");
    const userProfile = document.getElementById("user-profile");
    const loginErrorModal = document.getElementById("loginErrorModal");
    const closeLoginError = loginErrorModal.querySelector(".close");
    const retryBtn = loginErrorModal.querySelector(".retry-btn");

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

    // 카카오 로그인 상태 확인 및 UI 업데이트
    function updateLoginState() {
        if (Kakao.Auth.getAccessToken()) {
            Kakao.API.request({
                url: '/v2/user/me',
                success: function(response) {
                    // 기본 정보만 받아오도록 수정
                    const nickname = response.properties?.nickname || '사용자';
                    const profileImage = response.properties?.thumbnail_image || '/api/placeholder/32/32';
                    
                    loginLink.innerHTML = `
                        <img src="${profileImage}" 
                             alt="프로필" 
                             class="profile-img" 
                             onerror="this.src='/api/placeholder/32/32'">
                        ${nickname}
                    `;
                    userProfile.textContent = nickname;
                    logoutMenu.style.display = "block";
                    
                    console.log('로그인 성공:', response); // 디버깅용
                },
                fail: function(error) {
                    console.error('카카오 프로필 조회 실패', error);
                    handleLogout();
                }
            });
        } else {
            handleLogout();
        }
    }

    // 카카오 로그인
    loginLink.addEventListener("click", function(e) {
        e.preventDefault();
        if (!Kakao.Auth.getAccessToken()) {
            Kakao.Auth.login({
                scope: 'profile_nickname, profile_image', // 필요한 scope만 요청
                success: function(authObj) {
                    console.log('로그인 성공:', authObj);
                    updateLoginState();
                },
                fail: function(err) {
                    console.error('로그인 실패:', err);
                    loginErrorModal.style.display = "block";
                }
            });
        }
    });

    // 로그아웃
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
    }

    logoutLink.addEventListener("click", function(e) {
        e.preventDefault();
        handleLogout();
    });

    // 에러 모달 관련
    closeLoginError.addEventListener("click", function() {
        loginErrorModal.style.display = "none";
    });

    retryBtn.addEventListener("click", function() {
        loginErrorModal.style.display = "none";
        loginLink.click();
    });

    window.addEventListener("click", function(event) {
        if (event.target === loginErrorModal) {
            loginErrorModal.style.display = "none";
        }
    });

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

        ws = new WebSocket('ws://localhost:8000/ws');
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
            addMessage('서버와의 연결이 끊어졌습니다. 페이지를 새로고침해 주세요.', 'bot');
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

    // 카카오맵 초기화
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
            
            // 주변 병원 검색
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
                    <h3 class="hospital-name">${hospital.place_name}</h3>
                    <p class="hospital-details">${hospital.road_address_name || hospital.address_name}</p>
                    <p class="hospital-details">전화번호: ${hospital.phone}</p>
                </div>
            `;
            hospitalsGrid.appendChild(hospitalCard);
            displayMarker(hospital);
        });
        setupSlider();
    }

    // 마커 표시
    function displayMarker(place) {
        const marker = new kakao.maps.Marker({
            map: map,
            position: new kakao.maps.LatLng(place.y, place.x),
        });

        kakao.maps.event.addListener(marker, "click", function () {
            const infowindow = new kakao.maps.InfoWindow({ zIndex: 1 });
            infowindow.setContent(`<div style="padding:5px;">${place.place_name}</div>`);
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

    // 초기화 함수 호출
    connectWebSocket();
    updateLoginState();
});
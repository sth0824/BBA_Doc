document.addEventListener("DOMContentLoaded", function () {
    const loginLink = document.getElementById("login-link");
    const logoutMenu = document.getElementById("logout-menu");
    const logoutLink = document.getElementById("logout-link");
    const loginModal = document.getElementById("loginModal");
    const signupModal = document.getElementById("signupModal");
    const loginForm = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");
    const closeLoginModal = document.querySelector(".close-login");
    const closeSignupModal = document.querySelector(".close-signup");
    const signupLink = document.getElementById("signup-link");
    const loginLinkFromSignup = document.getElementById("login-link-from-signup");

    // 로그인 상태 확인
    const storedEmail = localStorage.getItem("loggedInEmail");
    if (storedEmail) {
        const username = storedEmail.split("@")[0]; // 이메일의 @ 앞부분만 추출
        loginLink.textContent = username; // 로그인 링크에 사용자 이름 표시
        logoutMenu.style.display = "block"; // 로그아웃 메뉴 표시
    } else {
        logoutMenu.style.display = "none"; // 로그인하지 않았을 경우 로그아웃 메뉴 숨김
    }

    // 로그인 링크 클릭 시 로그인 모달 열기
    loginLink.addEventListener("click", function (e) {
        e.preventDefault();
        if (!storedEmail) {
            loginModal.style.display = "block";
        }
    });

    // 로그인 모달 닫기
    closeLoginModal.addEventListener("click", function () {
        loginModal.style.display = "none";
    });

    window.addEventListener("click", function (event) {
        if (event.target === loginModal) {
            loginModal.style.display = "none";
        }
    });

    // 회원가입 링크 클릭 시 회원가입 모달 열기
    signupLink.addEventListener("click", function (e) {
        e.preventDefault();
        loginModal.style.display = "none";
        signupModal.style.display = "block";
    });

    // 회원가입 모달 닫기
    closeSignupModal.addEventListener("click", function () {
        signupModal.style.display = "none";
    });

    window.addEventListener("click", function (event) {
        if (event.target === signupModal) {
            signupModal.style.display = "none";
        }
    });

    // 로그인 폼 제출 시 처리
    loginForm.addEventListener("submit", function (e) {
        e.preventDefault();
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        if (email && password) {
            localStorage.setItem("loggedInEmail", email);
            const username = email.split("@")[0];
            loginLink.textContent = username;
            logoutMenu.style.display = "block";
            loginModal.style.display = "none";
        } else {
            alert("이메일과 비밀번호를 입력해주세요.");
        }
    });

    // 회원가입 폼 제출 시 처리
signupForm.addEventListener("submit", function(e) {
    e.preventDefault(); // 기본 폼 제출 방지
    const email = document.getElementById("signup-email").value;
    const password = document.getElementById("signup-password").value;
    const passwordConfirm = document.getElementById("signup-password-confirm").value;

    // 비밀번호 일치 여부 확인
    if (password !== passwordConfirm) {
        alert("비밀번호가 일치하지 않습니다. 다시 입력해주세요.");
        return; // 비밀번호가 일치하지 않으면 회원가입 진행 중단
    }

    // 회원가입 처리 (로컬 스토리지에 저장 예시)
    if (email && password) {
        localStorage.setItem("user-" + email, JSON.stringify({ email, password }));
        alert("회원가입이 완료되었습니다. 로그인 해주세요.");
        signupModal.style.display = "none"; // 회원가입 모달 닫기
        loginModal.style.display = "block"; // 로그인 모달 열기
    } else {
        alert("이메일과 비밀번호를 입력해주세요.");
    }
});


    // 로그아웃 처리
    logoutLink.addEventListener("click", function (e) {
        e.preventDefault();
        localStorage.removeItem("loggedInEmail");
        loginLink.textContent = "로그인";
        logoutMenu.style.display = "none";
    });

    // 카카오맵 API 초기화
    const mapContainer = document.getElementById("map");
    const options = {
        center: new kakao.maps.LatLng(33.450701, 126.570667), // 기본 좌표
        level: 5,
    };
    const map = new kakao.maps.Map(mapContainer, options);

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            const locPosition = new kakao.maps.LatLng(lat, lon);

            // 사용자 위치를 지도 중심으로 설정
            map.setCenter(locPosition);
            
             // 현재 위치 마커 이미지 설정 (파란색 마커로 변경)
            const imageSrc = 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png'; // 파란색 별 모양 마커 이미지
            const imageSize = new kakao.maps.Size(24, 35); // 마커 이미지의 크기
            const markerImage = new kakao.maps.MarkerImage(imageSrc, imageSize);

            // 현재 위치에 마커 표시
            const currentLocationMarker = new kakao.maps.Marker({
                map: map,
                position: locPosition,
                image: markerImage // 이미지 적용
            });

            const currentLocationInfo = new kakao.maps.InfoWindow({
                content: '<div style="padding:5px;">현재 위치</div>'
            });

            // 병원 검색을 위한 카카오맵 서비스 객체 생성
            const ps = new kakao.maps.services.Places();
            ps.keywordSearch(
                "병원",
                function (data, status) {
                    if (status === kakao.maps.services.Status.OK) {
                        displayHospitals(data); // 병원 정보 표시
                    }
                },
                {
                    location: locPosition,
                    radius: 5000, // 반경 5km 내에서 병원 검색
                }
            );

            // 병원 정보를 그리드에 추가하는 함수
            function displayHospitals(hospitals) {
                const hospitalsGrid = document.querySelector(".hospitals-grid");
                hospitalsGrid.innerHTML = ""; // 기존 병원 카드 초기화

                hospitals.forEach(function (hospital) {
                    const hospitalCard = document.createElement("div");
                    hospitalCard.classList.add("hospital-card");

                    // 병원 카드 HTML 추가
                    hospitalCard.innerHTML = `
                        <div class="hospital-info">
                            <h3 class="hospital-name">${hospital.place_name}</h3>
                            <p class="hospital-details">${hospital.road_address_name || hospital.address_name}</p>
                            <p class="hospital-details">전화번호: ${hospital.phone}</p>
                        </div>
                    `;
                    hospitalsGrid.appendChild(hospitalCard);

                    // 병원 위치에 마커 표시
                    displayMarker(hospital);
                });
                setupSlider(); // 병원 카드 슬라이더 적용
            }

            // 병원 위치에 마커를 표시하는 함수
            function displayMarker(place) {
                const marker = new kakao.maps.Marker({
                    map: map,
                    position: new kakao.maps.LatLng(place.y, place.x), // 병원 위치
                });

                // 마커 클릭 시 정보 표시
                kakao.maps.event.addListener(marker, "click", function () {
                    const infowindow = new kakao.maps.InfoWindow({ zIndex: 1 });
                    infowindow.setContent(`<div style="padding:5px;">${place.place_name}</div>`);
                    infowindow.open(map, marker);
                });
            }

            // 병원 슬라이더 설정 함수
            function setupSlider() {
                const items = document.querySelectorAll(".hospital-card");
                const totalItems = items.length;
                let currentIndex = 0;
                const itemsPerView = 3; // 화면에 표시할 병원 카드 수
                const itemWidth = items[0].offsetWidth + parseInt(window.getComputedStyle(items[0]).marginRight);

                // 슬라이더 이동 함수
                function moveSlider(index) {
                    const slider = document.querySelector(".hospitals-grid");
                    slider.style.transform = `translateX(-${itemWidth * index}px)`;
                }

                // 이전 버튼 클릭 시 슬라이드 이동
                document.querySelector(".prev-btn").addEventListener("click", function () {
                    if (currentIndex > 0) {
                        currentIndex--;
                        moveSlider(currentIndex);
                    }
                });

                // 다음 버튼 클릭 시 슬라이드 이동
                document.querySelector(".next-btn").addEventListener("click", function () {
                    if (currentIndex < totalItems - itemsPerView) {
                        currentIndex++;
                        moveSlider(currentIndex);
                    }
                });

                // 창 크기 변경 시 슬라이더 재설정
                window.addEventListener("resize", function () {
                    moveSlider(currentIndex);
                });
            }
        });
    } else {
        alert("현재 위치를 불러올 수 없습니다.");
    }
});

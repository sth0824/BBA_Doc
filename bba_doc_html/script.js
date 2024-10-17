document.addEventListener("DOMContentLoaded", function() {
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

    // 로그인 상태 확인 (이전에 로그인한 기록이 있을 때)
    const storedEmail = localStorage.getItem("loggedInEmail");
    if (storedEmail) {
        const username = storedEmail.split("@")[0]; // 이메일의 @ 앞부분만 추출
        loginLink.textContent = username; // 로그인 링크에 사용자 이름 표시
        logoutMenu.style.display = "block"; // 로그아웃 메뉴 표시
    } else {
        logoutMenu.style.display = "none"; // 로그인하지 않았을 경우 로그아웃 메뉴 숨김
    }

    // 로그인 링크 클릭 시 로그인 모달 열기
    loginLink.addEventListener("click", function(e) {
        e.preventDefault(); // 기본 링크 동작 방지
        if (!storedEmail) { // 로그인하지 않은 상태일 때만 모달 열기
            loginModal.style.display = "block"; // 로그인 모달 표시
        }
    });

    // 로그인 모달 닫기 버튼 클릭 시 모달 숨기기
    closeLoginModal.addEventListener("click", function() {
        loginModal.style.display = "none"; // 로그인 모달 숨기기
    });

    // 로그인 모달 외부 클릭 시 모달 닫기
    window.addEventListener("click", function(event) {
        if (event.target === loginModal) {
            loginModal.style.display = "none"; // 외부 클릭 시 모달 닫기
        }
    });

    // 회원가입 링크 클릭 시 회원가입 모달 열기
    signupLink.addEventListener("click", function(e) {
        e.preventDefault();
        loginModal.style.display = "none"; // 로그인 모달 닫기
        signupModal.style.display = "block"; // 회원가입 모달 열기
    });

    // 회원가입 모달 닫기 버튼 클릭 시 모달 숨기기
    closeSignupModal.addEventListener("click", function() {
        signupModal.style.display = "none"; // 회원가입 모달 닫기
    });

    // 회원가입 모달 외부 클릭 시 모달 닫기
    window.addEventListener("click", function(event) {
        if (event.target === signupModal) {
            signupModal.style.display = "none"; // 외부 클릭 시 모달 닫기
        }
    });

    // 로그인 폼 제출 시 처리
    loginForm.addEventListener("submit", function(e) {
        e.preventDefault(); // 기본 폼 제출 방지
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        // 이메일과 비밀번호 유효성 검사 후 로그인 처리
        if (email && password) {
            localStorage.setItem("loggedInEmail", email); // 이메일 저장
            const username = email.split("@")[0]; // 이메일에서 @ 앞부분만 추출
            loginLink.textContent = username; // 로그인 링크에 표시
            logoutMenu.style.display = "block"; // 로그아웃 메뉴 표시
            loginModal.style.display = "none"; // 로그인 모달 닫기
        } else {
            alert("이메일과 비밀번호를 입력해주세요."); // 입력값이 없을 때 알림
        }
    });

    // 회원가입 폼 제출 시 처리
    signupForm.addEventListener("submit", function(e) {
        e.preventDefault(); // 기본 폼 제출 방지
        const email = document.getElementById("signup-email").value;
        const password = document.getElementById("signup-password").value;

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
    logoutLink.addEventListener("click", function(e) {
        e.preventDefault(); // 링크 기본 동작 방지
        localStorage.removeItem("loggedInEmail"); // 로그아웃 처리 (로컬 스토리지에서 제거)
        loginLink.textContent = "로그인"; // 다시 '로그인'으로 변경
        logoutMenu.style.display = "none"; // 로그아웃 메뉴 숨기기
    });
});

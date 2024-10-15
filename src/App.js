import React, { useState } from 'react';
import './App.css'; // 스타일 파일

function App() {
    // 상태 관리
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [isSignupModalOpen, setIsSignupModalOpen] = useState(false); // 회원가입 모달 열기/닫기 상태
    const [isHospitalModalOpen, setIsHospitalModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState({ name: '', details: '', imageUrl: '', rating: '' });
    const [rememberMe, setRememberMe] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loggedInUser, setLoggedInUser] = useState(null); // 로그인한 사용자 정보

    // 회원가입 폼 상태
    const [signupEmail, setSignupEmail] = useState('');
    const [signupPassword, setSignupPassword] = useState('');

    // 검색 버튼 클릭 시 호출
    const handleSearch = () => {
        alert(`검색어 "${searchTerm}"에 대한 결과를 찾고 있습니다. (실제 검색 기능은 백엔드 연동이 필요합니다)`);
    };

    // 병원 모달 열기
    const openHospitalModal = (name, details, imageUrl, rating) => {
        setModalContent({ name, details, imageUrl, rating });
        setIsHospitalModalOpen(true);
    };

    // 로그인 모달 열기
    const openLoginModal = () => {
        setIsLoginModalOpen(true);
    };

    // 회원가입 모달 열기
    const openSignupModal = () => {
        setIsSignupModalOpen(true);
        setIsLoginModalOpen(false); // 로그인 모달 닫기
    };

    // 모달 닫기
    const closeModal = () => {
        setIsLoginModalOpen(false);
        setIsSignupModalOpen(false);
        setIsHospitalModalOpen(false);
    };

    // 회원가입 처리 (로컬 스토리지에 사용자 정보 저장)
    const handleSignup = () => {
        if (signupEmail && signupPassword) {
            localStorage.setItem('user', JSON.stringify({ email: signupEmail, password: signupPassword }));
            alert('회원가입이 완료되었습니다. 로그인해 주세요.');
            closeModal();
        } else {
            alert('이메일과 비밀번호를 입력하세요.');
        }
    };

    // 로그인 처리 (로컬 스토리지에서 사용자 정보 확인)
    const handleLogin = () => {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (storedUser && storedUser.email === email && storedUser.password === password) {
            setLoggedInUser(storedUser.email); // 로그인한 사용자 이메일을 상태로 저장
            alert('로그인 성공!');
            closeModal();
        } else {
            alert('이메일 또는 비밀번호가 잘못되었습니다.');
        }
    };

    return (
        <div>
            {/* 헤더 */}
            <header>
                <nav className="container">
                    <div className="logo">BBADOC</div>
                    <div className="nav-links">
                        <a href="#home">홈</a>
                        <a href="#hospitals">병원 목록</a>
                        <a href="#about">소개</a>
                        {/* 로그인 상태에 따라 표시 */}
                        {loggedInUser ? (
                            <span className="user-email">{loggedInUser}</span> // 로그인 후 이메일 표시
                        ) : (
                            <a href="#login" className="login-link" onClick={(e) => { e.preventDefault(); openLoginModal(); }}>
                                로그인
                            </a>
                        )}
                    </div>
                </nav>
            </header>

            {/* 검색 섹션 */}
            <section className="hero" id="home">
                <div className="container">
                    <h1>당신의 건강을 위한 최선의 선택</h1>
                    <p>증상에 맞는 최적의 병원을 빠르고 정확하게 찾아드립니다.</p>
                    <div className="search-container" id="search">
                        <input 
                            type="text" 
                            className="search-input" 
                            placeholder="증상이나 진료과목을 입력하세요"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <button className="search-btn" onClick={handleSearch}>검색</button>
                    </div>
                </div>
            </section>

            {/* 병원 목록 섹션 */}
            <section className="section" id="hospitals">
                <div className="container">
                    <h2 className="section-title">추천 병원</h2>
                    <div className="hospitals-grid">
                        {[
                            {
                                name: '강남연세소아과의원',
                                details: '내과 · 외과 · 소아과, 서울시 강남구, 현재 대기 시간: 약 30분',
                                imageUrl: '/api/placeholder/400/200',
                                rating: '★★★★☆ 4.5'
                            },
                            {
                                name: '서초양재참좋은정형외과',
                                details: '정형외과 · 신경과, 서울시 서초구, 현재 대기 시간: 약 15분',
                                imageUrl: '/api/placeholder/400/200',
                                rating: '★★★★☆ 4.2'
                            },
                            {
                                name: '연세헬리오 소아청소년과',
                                details: '소아과 · 소아정신과, 서울시 송파구, 현재 대기 시간: 약 45분',
                                imageUrl: '/api/placeholder/400/200',
                                rating: '★★★★★ 4.8'
                            }
                        ].map((hospital, index) => (
                            <div 
                                key={index} 
                                className="hospital-card" 
                                onClick={() => openHospitalModal(hospital.name, hospital.details, hospital.imageUrl, hospital.rating)}
                            >
                                <img src={hospital.imageUrl} alt={hospital.name} className="hospital-image" />
                                <div className="hospital-info">
                                    <h3 className="hospital-name">{hospital.name}</h3>
                                    <p className="hospital-details">{hospital.details}</p>
                                    <div className="rating">{hospital.rating}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 병원 모달 */}
            {isHospitalModalOpen && (
                <div className="modal">
                    <div className="modal-content">
                        <span className="close" onClick={closeModal}>&times;</span>
                        <h2>{modalContent.name}</h2>
                        <img src={modalContent.imageUrl} alt={modalContent.name} className="modal-image" />
                        <p>{modalContent.details}</p>
                        <div className="rating">Rating: {modalContent.rating}</div>
                    </div>
                </div>
            )}

            {/* 로그인 모달 */}
            {isLoginModalOpen && (
                <div className="modal">
                    <div className="modal-content">
                        <span className="close" onClick={closeModal}>&times;</span>
                        <h2>로그인</h2>
                        <div className="form-group">
                            <input 
                                type="email" 
                                placeholder="아이디를 입력해주세요" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <input 
                                type="password" 
                                placeholder="비밀번호를 입력해주세요" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        <div className="form-options">
                            <label>
                                <input 
                                    type="checkbox" 
                                    checked={rememberMe} 
                                    onChange={() => setRememberMe(!rememberMe)} 
                                />
                                로그인 정보 저장
                            </label>
                            <div className="find-links">
                                <a href="#find-id">아이디 찾기</a> | <a href="#find-password">비밀번호 찾기</a>
                            </div>
                        </div>
                        <button className="submit-btn" onClick={handleLogin}>로그인</button>
                        <button className="signup-btn" onClick={openSignupModal}>회원가입</button>
                    </div>
                </div>
            )}

            {/* 회원가입 모달 */}
            {isSignupModalOpen && (
                <div className="modal">
                    <div className="modal-content">
                        <span className="close" onClick={closeModal}>&times;</span>
                        <h2>회원가입</h2>
                        <div className="form-group">
                            <input 
                                type="email" 
                                placeholder="아이디를 입력해주세요" 
                                value={signupEmail}
                                onChange={(e) => setSignupEmail(e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <input 
                                type="password" 
                                placeholder="비밀번호를 입력해주세요" 
                                value={signupPassword}
                                onChange={(e) => setSignupPassword(e.target.value)}
                            />
                        </div>
                        <button className="submit-btn" onClick={handleSignup}>회원가입 완료</button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;

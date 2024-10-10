import React, { useState } from 'react';
import './App.css'; // Add custom styles here

function App() {
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState({ name: '', details: '' });

    const handleSearch = () => {
        alert(`검색어 "${searchTerm}"에 대한 결과를 찾고 있습니다. (실제 검색 기능은 백엔드 연동이 필요합니다)`);
    };

    const openModal = (name, details) => {
        setModalContent({ name, details });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    return (
        <div>
            <header>
                <nav className="container">
                    <div className="logo">BBADOC</div>
                    <div className="nav-links">
                        <a href="#home">홈</a>
                        <a href="#search">검색</a>
                        <a href="#hospitals">병원 목록</a>
                        <a href="#about">소개</a>
                    </div>
                </nav>
            </header>

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

            <section className="section" id="hospitals">
                <div className="container">
                    <h2 className="section-title">추천 병원</h2>
                    <div className="hospitals-grid">
                        {[
                            {
                                name: 'A 종합병원',
                                details: '내과 · 외과 · 소아과, 서울시 강남구, 현재 대기 시간: 약 30분',
                                imageUrl: '/api/placeholder/400/200',
                                rating: '★★★★☆ 4.5'
                            },
                            {
                                name: 'B 메디컬센터',
                                details: '정형외과 · 신경과, 서울시 서초구, 현재 대기 시간: 약 15분',
                                imageUrl: '/api/placeholder/400/200',
                                rating: '★★★★☆ 4.2'
                            },
                            {
                                name: 'C 어린이병원',
                                details: '소아과 · 소아정신과, 서울시 송파구, 현재 대기 시간: 약 45분',
                                imageUrl: '/api/placeholder/400/200',
                                rating: '★★★★★ 4.8'
                            }
                        ].map((hospital, index) => (
                            <div 
                                key={index} 
                                className="hospital-card" 
                                onClick={() => openModal(hospital.name, hospital.details)}
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

            <section className="cta-section">
                <div className="container">
                    <h2>지금 바로 최적의 병원을 찾아보세요</h2>
                    <p>BBADOC와 함께 건강한 삶을 시작하세요</p>
                    <a href="#search" className="cta-btn">병원 찾기</a>
                </div>
            </section>

            <footer>
                <div className="container">
                    <p>&copy; 2024 BBADOC. All rights reserved.</p>
                </div>
            </footer>

            {isModalOpen && (
                <div className="modal">
                    <div className="modal-content">
                        <span className="close" onClick={closeModal}>&times;</span>
                        <h2>{modalContent.name}</h2>
                        <p>{modalContent.details}</p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;

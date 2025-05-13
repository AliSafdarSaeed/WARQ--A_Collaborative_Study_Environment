import React from "react";
import { Link } from "react-router-dom";
import "../App.css"; // adjust path if needed
import AnimatedBoxes from "../AnimatedBoxes";
import shuttle from '../assets/shuttle.png';
import group from '../assets/group-chat.png';
import features from '../assets/multi-feature.png';
import progressBar from '../assets/progress.png';
import groupLeader from '../assets/leader.png';
import frontend from '../assets/ui-ux.png';
import backend from '../assets/backend.png';
import authentication from '../assets/authentication.png';
import chat from '../assets/chat.png';
import githubIcon from '../assets/github.png';

const HomePage = () => {
  return (
    <div style={{ height: "100%", width: "100%" }}>
      <header className="header">
        <span className="warq-logo-container" style={{ fontSize: '40px' }}>WARQ</span>
        <div>
          <Link to="/signup"><button className="button">Sign Up</button></Link>
          <Link to="/login"><button className="button">Log In</button></Link>
        </div>
      </header>
      <main className="main">
        <div className="hero-wrapper">
          <span className="warq-logo-container" style={{fontSize: '100px'}}>WARQ</span>
          <p className="hero-text">
            Your one-stop platform for study collaboration.
          </p>
          <p style={{color: "gray", fontSize: '22px'}}>You work better in a group too?-WARQ lets you connect and collaborate
              with classmates or teammates—share notes, exchange ideas, and grow together, all in one place.</p>
        </div>
        <br />
        
        {/* Add the AnimatedBoxes component here */}
        <AnimatedBoxes />
        <br />
        <br />
        {/* You can add more sections below */}
        <h1 className="headings">Not your everyday text-editor!</h1>
        <div className="feature_box">
          <div className="feature-box-item">
            
            <img src={features} alt="Design Logo" className="widget" />
            <div className="box-header">
            <h2 className="feature-title">Complete Package</h2>
          </div>
          <div className="box-desc">
              <p>Our application offers a comprehensive suite of features—all
              integrated in one place to ensure a seamless, efficient, and focused learning experience.</p>

          </div>
          </div>
          <div className="feature-box-item">
            
            <img src={group} alt="Design Logo" className="widget" />
            <div className="box-header">
            <h2 className="feature-title">Collaboration</h2>
          </div>
          <div className="box-desc">
              <p>We bring learners together through real-time collaboration, enabling teams to create, edit, and study notes
                collectively—fostering a shared and productive learning environment.</p>

          </div>
          </div>
          <div className="feature-box-item">
            <img src={shuttle} alt="Design Logo" className="widget" />
            <div className="box-header">
            
            <h2 className="feature-title">Self-Assessment</h2>
          </div>
          <div className="box-desc">
            <p>Our application offers an intelligent self-assessment tool that generates AI-powered quizzes from your notes—helping you
              grow and level up your knowledge with every test.</p>


          </div>
          </div>
          <div className="feature-box-item">
            <img src={progressBar} alt="Design Logo" className="widget" />
            <div className="box-header">
            
            <h2 className="feature-title">Progess Tracking</h2>
          </div>
          <div className="box-desc">
              <p>We keeps a detailed record of your progress, tracking your preparation level on each
                topic—empowering you to see how far you've come and where to focus next.</p>

          </div>
          </div>
        </div>
        <div className="team-heading">
          <h2 style={{fontSize: '100px'}}>Team behind  </h2>
          <span className="warq-logo-container" style={{fontSize: '100px'}}>WARQ</span>
        </div>
        <p style={{color: "#ababab", fontSize: '22px', paddingLeft:'100px', paddingRight: '100px', textAlign: 'left'}}>
        WARQ is the product of a collaborative effort. We developed it as a group project for our Web Development and ADMS
        courses. Our vision was to create something that we would personally want to use as students.
        </p>
        <div className="feature_box">
          <div className="team-member" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <p style={{ fontSize: '30px', color: 'whitesmoke', fontWeight: '500' }}>Ali Safdar Saeed</p>
            <hr />
            <div>
            <div className="info-container">
              <div className="image-box">
                <img src={groupLeader} alt="Icon" className="info-image" />
              </div>
              <div className="info-text">
                Group Leader-Coordinated the development process.
              </div>
            </div>
            <div className="info-container">
              <div className="image-box">
                <img src={frontend} alt="Icon" className="info-image" />
              </div>
              <div className="info-text">
                Frontend-Designed and developed the UI/UX of the application.
              </div>
            </div>
            <div className="info-container">
              <div className="image-box">
                <img src={backend} alt="Icon" className="info-image" />
              </div>
              <div className="info-text">
                Backend-Contributed to desgning and developing the back-end.
              </div>
            </div>
            </div>
          </div>

          <div className="team-member" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <p style={{ fontSize: '30px', color: 'whitesmoke', fontWeight: '500' }}>Saqib Mahmood</p>
            <hr />
            <div>
            <div className="info-container">
              <div className="image-box">
                <img src={backend} alt="Icon" className="info-image" />
              </div>
              <div className="info-text">
                Backend-Contributed to the back-end development, and linking the database to the frontend.
              </div>
            </div>
            <div className="info-container">
              <div className="image-box">
                <img src={authentication} alt="Icon" className="info-image" />
              </div>
              <div className="info-text">
                User Authentication-Implemented the user authentication system using Firebase.
              </div>
            </div>
            </div>
          </div>
        
          <div className="team-member" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <p style={{ fontSize: '30px', color: 'whitesmoke', fontWeight: '500'}}>Qurat-ul-Ain</p>
            <hr />
            <div>
            <div className="info-container">
              <div className="image-box">
                <img src={chat} alt="Icon" className="info-image" />
              </div>
              <div className="info-text">
                Chat-Implemented the chat feature for real-time communication.
              </div>
            </div>
            <div className="info-container">
              <div className="image-box">
                <img src={backend} alt="Icon" className="info-image" />
              </div>
              <div className="info-text">
                Backend-Contributed to the back-end development.
              </div>
            </div>
            </div>
          </div>
          </div>

          <footer className="footer">
  <div className="footer-left">
    <p>© 2025 WAQR. All rights reserved.</p>
    <p>Website created for educational and demonstration purposes.</p>
  </div>
  <div className="footer-right">
    <a href="https://github.com/AliSafdarSaeed" target="_blank" rel="noopener noreferrer">
      <img src={githubIcon} alt="Icon" className="info-image" />
      <span>Ali Safdar Saeed</span>
    </a>
    <a href="https://github.com/SaqibM-bh" target="_blank" rel="noopener noreferrer">
      <img src={githubIcon} alt="Icon" className="info-image" />
      <span>Saqib Mahmood</span>
    </a>
    <a href="https://github.com/username3" target="_blank" rel="noopener noreferrer">
      <img src={githubIcon} alt="Icon" className="info-image" />
      <span>Qurat-ul-Ain</span>
    </a>
  </div>
</footer>

      </main>
    </div>
  );
};

export default HomePage;

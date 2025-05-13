import React from "react";
import "./AnimatedBoxes.css";
import barGraph from './assets/bar-graph.png';
import quiz from './assets/quiz.png';
import collaborate from './assets/collaboration.png';
import notes from './assets/notes.png';
import design from './assets/design.png';

const AnimatedBoxes = () => {
  return (
    <section className="animated-boxes-section">
      <h2 className="section-title">Why Choose WARQ?</h2>
      
      <div className="animated-boxes-container">
        {/* Wrapper for infinite animation */}
        <div className="animated-box-row-wrapper">
          {/* Row 1 */}
          <div className="animated-box-row">
            {/* Quiz Generator */}
            <div className="animated-box">
              <div className="box-header">
                <img src={quiz} alt="Quiz Logo" className="logo" />
                <h2 className="title">Smart Quizzes</h2>
              </div>
              <hr />
              <div className="box-description">
                <p>
                  Instantly generate quizzes from your notes to test your knowledge, revise faster, and focus on weak areas.
                </p>
              </div>
            </div>

            {/* Performance Analysis */}
            <div className="animated-box">
              <div className="box-header">
                <img src={barGraph} alt="Analytics Logo" className="logo" />
                <h2 className="title">Insights</h2>
              </div>
              <hr />
              <div className="box-description">
                <p>
                  Visualize your progress, analyze quiz scores, and track learning trends with clear performance reports.
                </p>
              </div>
            </div>

            {/* Notes Feature */}
            <div className="animated-box">
              <div className="box-header">
                <img src={notes} alt="Notes Logo" className="logo" />
                <h2 className="title">Smart Notes</h2>
              </div>
              <hr />
              <div className="box-description">
                <p>
                  Take, organize, and access notes with ease using a distraction-free, topic-wise smart editor.
                </p>
              </div>
            </div>

            {/* Collaboration Feature */}
            <div className="animated-box">
              <div className="box-header">
                <img src={collaborate} alt="Collaborate Logo" className="logo" />
                <h2 className="title">Team Study</h2>
              </div>
              <hr />
              <div className="box-description">
                <p>
                  Collaborate on notes and quizzes in real time with friends or classmates to boost learning.
                </p>
              </div>
            </div>

            {/* UI/UX Design */}
            <div className="animated-box">
              <div className="box-header">
                <img src={design} alt="Design Logo" className="logo" />
                <h2 className="title">Elegant UI</h2>
              </div>
              <hr />
              <div className="box-description">
                <p>
                  Simple, clean, and modern interface for a smooth, focused, and clutter-free learning experience.
                </p>
              </div>
            </div>
          </div>
          {/* Duplicate Row 1 for continuous wrap effect */}
          <div className="animated-box-row">
            {/* Quiz Generator */}
            <div className="animated-box">
              <div className="box-header">
                <img src={quiz} alt="Quiz Logo" className="logo" />
                <h2 className="title">Smart Quizzes</h2>
              </div>
              <hr />
              <div className="box-description">
                <p>
                  Instantly generate quizzes from your notes to test your knowledge, revise faster, and focus on weak areas.
                </p>
              </div>
            </div>

            {/* Performance Analysis */}
            <div className="animated-box">
              <div className="box-header">
                <img src={barGraph} alt="Analytics Logo" className="logo" />
                <h2 className="title">Insights</h2>
              </div>
              <hr />
              <div className="box-description">
                <p>
                  Visualize your progress, analyze quiz scores, and track learning trends with clear performance reports.
                </p>
              </div>
            </div>

            {/* Notes Feature */}
            <div className="animated-box">
              <div className="box-header">
                <img src={notes} alt="Notes Logo" className="logo" />
                <h2 className="title">Smart Notes</h2>
              </div>
              <hr />
              <div className="box-description">
                <p>
                  Take, organize, and access notes with ease using a distraction-free, topic-wise smart editor.
                </p>
              </div>
            </div>

            {/* Collaboration Feature */}
            <div className="animated-box">
              <div className="box-header">
                <img src={collaborate} alt="Collaborate Logo" className="logo" />
                <h2 className="title">Team Study</h2>
              </div>
              <hr />
              <div className="box-description">
                <p>
                  Collaborate on notes and quizzes in real time with friends or classmates to boost learning.
                </p>
              </div>
            </div>

            {/* UI/UX Design */}
            <div className="animated-box">
              <div className="box-header">
                <img src={design} alt="Design Logo" className="logo" />
                <h2 className="title">Elegant UI</h2>
              </div>
              <hr />
              <div className="box-description">
                <p>
                  Simple, clean, and modern interface for a smooth, focused, and clutter-free learning experience.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AnimatedBoxes;

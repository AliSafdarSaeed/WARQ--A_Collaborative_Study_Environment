import React, { useState, useRef } from 'react';
import './Dashboard.css';
import profileButton from '../../assets/user-profile.png';

function Dashboard() {
  const [content, setContent] = useState('');
  const editorRef = useRef(null);

  const handleInput = () => {
    setContent(editorRef.current.innerText);
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-body">
        <aside className="dashboard-sidebar">
            <div className="heading">
                <span className="warq-logo-container" style={{ fontSize: '36px'}}>WARQ</span>
                <div className="image-box" style={{width: '36px', height:'36px'}} >
                                <img src={profileButton} alt="Icon" className="info-image" />
                              </div>
            </div>
            <div className="prev-notes">
                <div className='heading'  style={{borderBottom: '2px solid #444',paddingLeft: '15px', paddingRight: '5px',
                    fontSize: '22px', fontWeight: '500', color: 'gray'}}>
                
                    Previous Notes</div>
            </div>
            <div className="footing" style={{border: '3px solid #444', borderRadius: '10px', color: 'gray'}}>
                Features Buttons here.
            </div>
        </aside>
        <main className="dashboard-main">
          <div className="editor-wrapper">
            <div className="file-info">
              <div className="file-name">File Name: My Note</div>
              <div className="save-text">Save</div>
            </div>

            <hr className="separator" />

            <div
              className="rich-text-editor"
              contentEditable
              ref={editorRef}
              data-placeholder="Start typing your notes here..."
              suppressContentEditableWarning={true}
              onInput={handleInput}
            ></div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;

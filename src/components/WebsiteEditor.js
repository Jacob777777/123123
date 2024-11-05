import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import './WebsiteEditor.css';
import { saveAs } from 'file-saver';

const WebsiteEditor = () => {
  const [content, setContent] = useState({
    title: '我的網站',
    sections: [
      {
        id: '1',
        type: 'text',
        content: '歡迎來到我的網站',
        style: {
          bold: false,
          italic: false,
          fontSize: '16px',
          color: '#000000'
        }
      }
    ]
  });

  const [selectedSection, setSelectedSection] = useState(null);

  const addSection = (type) => {
    const newSection = {
      id: Date.now().toString(),
      type: type,
      content: type === 'text' ? '新段落' : 'https://placeholder.com/image.jpg',
      style: {
        bold: false,
        italic: false,
        fontSize: '16px',
        color: '#000000'
      }
    };
    setContent(prev => ({
      ...prev,
      sections: [...prev.sections, newSection]
    }));
  };

  const updateSection = (id, newContent, styleUpdate = null) => {
    setContent(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section.id === id 
          ? { 
              ...section, 
              content: newContent,
              style: styleUpdate ? { ...section.style, ...styleUpdate } : section.style
            } 
          : section
      )
    }));
  };

  const deleteSection = (id) => {
    setContent(prev => ({
      ...prev,
      sections: prev.sections.filter(section => section.id !== id)
    }));
    setSelectedSection(null);
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(content.sections);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setContent(prev => ({ ...prev, sections: items }));
  };

  const renderFormatToolbar = (section) => {
    if (section.type !== 'text') return null;
    
    return (
      <div className="format-toolbar">
        <button 
          className={section.style.bold ? 'active' : ''}
          onClick={() => updateSection(section.id, section.content, { bold: !section.style.bold })}
        >
          粗體
        </button>
        <button 
          className={section.style.italic ? 'active' : ''}
          onClick={() => updateSection(section.id, section.content, { italic: !section.style.italic })}
        >
          斜體
        </button>
        <select 
          value={section.style.fontSize}
          onChange={(e) => updateSection(section.id, section.content, { fontSize: e.target.value })}
        >
          <option value="12px">小</option>
          <option value="16px">中</option>
          <option value="20px">大</option>
        </select>
        <input 
          type="color" 
          value={section.style.color}
          onChange={(e) => updateSection(section.id, section.content, { color: e.target.value })}
        />
      </div>
    );
  };

  const exportHTML = () => {
    const styles = `
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        .container { max-width: 1200px; margin: 0 auto; }
        img { max-width: 100%; height: auto; }
      </style>
    `;

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="zh">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${content.title}</title>
        ${styles}
      </head>
      <body>
        <div class="container">
          <h1>${content.title}</h1>
          ${content.sections.map(section => {
            if (section.type === 'text') {
              return `<p style="
                font-weight: ${section.style.bold ? 'bold' : 'normal'};
                font-style: ${section.style.italic ? 'italic' : 'normal'};
                font-size: ${section.style.fontSize};
                color: ${section.style.color};
              ">${section.content}</p>`;
            } else {
              return `<img src="${section.content}" alt="圖片">`;
            }
          }).join('\n')}
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    saveAs(blob, 'my-website.html');
  };

  const saveContent = () => {
    localStorage.setItem('websiteContent', JSON.stringify(content));
    alert('已保存！');
  };

  const loadContent = () => {
    const savedContent = localStorage.getItem('websiteContent');
    if (savedContent) {
      setContent(JSON.parse(savedContent));
      alert('已載入上次保存的內容！');
    }
  };

  useEffect(() => {
    const savedContent = localStorage.getItem('websiteContent');
    if (savedContent) {
      const shouldLoad = window.confirm('發現已保存的內容，是否要載入？');
      if (shouldLoad) {
        setContent(JSON.parse(savedContent));
      }
    }
  }, []);

  return (
    <div className="editor-container">
      <div className="toolbar">
        <button onClick={() => addSection('text')}>添加文字</button>
        <button onClick={() => addSection('image')}>添加圖片</button>
        <button onClick={saveContent} className="save-button">保存編輯</button>
        <button onClick={loadContent} className="load-button">載入編輯</button>
        <button onClick={exportHTML} className="export-button">導出網站</button>
      </div>
      
      <div className="editor-workspace">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="edit-panel">
            <input
              type="text"
              value={content.title}
              onChange={(e) => setContent(prev => ({ ...prev, title: e.target.value }))}
              className="title-input"
            />
            
            <Droppable droppableId="sections">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef}>
                  {content.sections.map((section, index) => (
                    <Draggable key={section.id} draggableId={section.id} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`section ${selectedSection === section.id ? 'selected' : ''}`}
                        >
                          <div className="section-header" {...provided.dragHandleProps}>
                            <span>拖動排序</span>
                            <button 
                              className="delete-button"
                              onClick={() => deleteSection(section.id)}
                            >
                              刪除
                            </button>
                          </div>
                          
                          <div onClick={() => setSelectedSection(section.id)}>
                            {renderFormatToolbar(section)}
                            {section.type === 'text' ? (
                              <textarea
                                value={section.content}
                                onChange={(e) => updateSection(section.id, e.target.value)}
                                style={{
                                  fontWeight: section.style.bold ? 'bold' : 'normal',
                                  fontStyle: section.style.italic ? 'italic' : 'normal',
                                  fontSize: section.style.fontSize,
                                  color: section.style.color
                                }}
                              />
                            ) : (
                              <div className="image-section">
                                <input
                                  type="text"
                                  value={section.content}
                                  onChange={(e) => updateSection(section.id, e.target.value)}
                                  placeholder="輸入圖片URL"
                                />
                                <img src={section.content} alt="預覽" />
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        </DragDropContext>
        
        <div className="preview-panel">
          <h1>{content.title}</h1>
          {content.sections.map(section => (
            <div key={section.id}>
              {section.type === 'text' ? (
                <p style={{
                  fontWeight: section.style.bold ? 'bold' : 'normal',
                  fontStyle: section.style.italic ? 'italic' : 'normal',
                  fontSize: section.style.fontSize,
                  color: section.style.color
                }}>
                  {section.content}
                </p>
              ) : (
                <img src={section.content} alt="內容圖片" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WebsiteEditor; 
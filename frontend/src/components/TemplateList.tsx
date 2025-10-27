import React from 'react';
import { Template } from '../types/template';

interface TemplateListProps {
  templates: Template[];
  selectedTemplate: Template | null;
  onTemplateSelect: (template: Template) => void;
}

const TemplateList: React.FC<TemplateListProps> = ({
  templates,
  selectedTemplate,
  onTemplateSelect,
}) => {
  const templateItemStyle = (isSelected: boolean): React.CSSProperties => ({
    padding: '16px 20px',
    background: isSelected ? 'rgba(236, 72, 153, 0.1)' : '#1a1a1a',
    border: `1px solid ${isSelected ? '#ec4899' : 'rgba(255, 255, 255, 0.15)'}`,
    borderRadius: '12px',
    color: '#ffffff',
    cursor: 'none',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    textAlign: 'left',
    marginBottom: '12px',
    boxShadow: isSelected ? 'inset 0 0 20px rgba(236, 72, 153, 0.2)' : '0 4px 16px rgba(0, 0, 0, 0.3)',
  });

  const templateNameStyle: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '8px',
    color: '#ffffff',
  };

  const templateDescriptionStyle: React.CSSProperties = {
    fontSize: '14px',
    color: '#9ca3af',
    lineHeight: '1.4',
    marginBottom: '8px',
  };

  const templateCategoryStyle: React.CSSProperties = {
    fontSize: '12px',
    color: '#6b7280',
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: '0.5px',
  };

  const selectedIndicatorStyle: React.CSSProperties = {
    color: '#ec4899',
    fontSize: '20px',
    fontWeight: 'bold',
    float: 'right' as const,
  };

  return (
    <div style={{
      width: '100%',
      height: '100%'
    }}>
      <div>
        {templates.map((template) => (
          <div
            key={template.id}
            onClick={() => onTemplateSelect(template)}
            style={templateItemStyle(selectedTemplate?.id === template.id)}
            data-magnetic
            onMouseEnter={(e) => {
              if (selectedTemplate?.id !== template.id) {
                e.currentTarget.style.borderColor = 'rgba(236, 72, 153, 0.5)';
                e.currentTarget.style.background = 'rgba(236, 72, 153, 0.05)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(236, 72, 153, 0.2)';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedTemplate?.id !== template.id) {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                e.currentTarget.style.background = '#1a1a1a';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.3)';
              }
            }}
          >
            <div style={templateNameStyle}>
              {template.name}
              {selectedTemplate?.id === template.id && (
                <span style={selectedIndicatorStyle}>✓</span>
              )}
            </div>
            <div style={templateDescriptionStyle}>
              {template.description}
            </div>
            <div style={templateCategoryStyle}>
              {template.category}
            </div>
          </div>
        ))}
      </div>

      {selectedTemplate && (
        <div style={{
          marginTop: '20px',
          padding: '16px',
          background: 'rgba(236, 72, 153, 0.1)',
          border: '1px solid rgba(236, 72, 153, 0.3)',
          borderRadius: '12px',
        }}>
          <div style={{
            fontSize: '14px',
            color: '#9ca3af',
            marginBottom: '8px',
          }}>
            Selected Template:
          </div>
          <div style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#ffffff',
          }}>
            {selectedTemplate.name}
          </div>
          <div style={{
            fontSize: '12px',
            color: '#ec4899',
            marginTop: '4px',
          }}>
            Format: {selectedTemplate.format.toUpperCase()}
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateList;

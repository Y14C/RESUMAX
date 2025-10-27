import React from 'react';
import { Template } from '../types/template';

interface TemplatePreviewProps {
  selectedTemplate: Template | null;
}

const TemplatePreview: React.FC<TemplatePreviewProps> = ({ selectedTemplate }) => {
  const previewContainerStyle: React.CSSProperties = {
    background: '#ffffff',
    borderRadius: '8px',
    padding: '20px',
    height: '600px',
    overflow: 'auto',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
    margin: '20px 0',
    position: 'relative',
  };

  const resumePreviewStyle: React.CSSProperties = {
    fontFamily: 'Arial, sans-serif',
    fontSize: '11pt',
    lineHeight: '1.3',
    color: '#000000',
    maxWidth: '100%',
  };

  const headerStyle: React.CSSProperties = {
    textAlign: 'center',
    borderBottom: '2px solid #333',
    paddingBottom: '10px',
    marginBottom: '15px',
  };

  const nameStyle: React.CSSProperties = {
    fontSize: '18pt',
    fontWeight: 'bold',
    marginBottom: '5px',
  };

  const contactStyle: React.CSSProperties = {
    fontSize: '9pt',
    color: '#666',
    marginBottom: '3px',
  };

  const sectionHeaderStyle: React.CSSProperties = {
    fontSize: '12pt',
    fontWeight: 'bold',
    marginTop: '15px',
    marginBottom: '8px',
    borderBottom: '1px solid #333',
    paddingBottom: '3px',
  };

  const bulletPointStyle: React.CSSProperties = {
    marginLeft: '15px',
    marginBottom: '3px',
    fontSize: '9pt',
  };

  const placeholderTextStyle: React.CSSProperties = {
    color: '#999',
    fontStyle: 'italic',
  };

  if (!selectedTemplate) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          width: '300px',
          height: '400px',
          background: 'rgba(255, 255, 255, 0.1)',
          border: '2px dashed rgba(255, 255, 255, 0.3)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#6b7280',
          fontSize: '16px',
        }}>
          No template selected
        </div>
      </div>
    );
  }

  return (
    <div style={{
      width: '100%',
      height: '100%'
    }}>
      <div style={previewContainerStyle}>
        <div style={resumePreviewStyle}>
          {/* Header Section */}
          <div style={headerStyle}>
            <div style={nameStyle}>[Your Full Name]</div>
            <div style={contactStyle}>your.email@example.com | (555) 123-4567</div>
            <div style={contactStyle}>
              LinkedIn: <span style={placeholderTextStyle}>linkedin.com/in/yourprofile</span>
            </div>
          </div>

          {/* Professional Summary */}
          <div style={sectionHeaderStyle}>PROFESSIONAL SUMMARY</div>
          <div style={{ marginBottom: '10px', fontSize: '9pt' }}>
            Results-driven professional with expertise in [your field]. Proven track record of [specific achievements].
            Seeking to leverage [skills] to contribute to [company goals].
          </div>

          {/* Education */}
          <div style={sectionHeaderStyle}>EDUCATION</div>
          <div style={{ fontSize: '9pt', marginBottom: '5px' }}>
            <strong>[Degree Name]</strong> | [University Name]
          </div>
          <div style={{ fontSize: '8pt', color: '#666', marginBottom: '10px' }}>
            [Graduation Year] | GPA: [GPA]
          </div>

          {/* Work Experience */}
          <div style={sectionHeaderStyle}>WORK EXPERIENCE</div>

          <div style={{ marginBottom: '10px' }}>
            <div style={{ fontSize: '9pt', fontWeight: 'bold' }}>
              [Job Title] | [Company Name]
            </div>
            <div style={{ fontSize: '8pt', color: '#666', marginBottom: '5px' }}>
              [Start Date] - [End Date] | [Location]
            </div>
            <ul style={{ margin: '0', paddingLeft: '15px' }}>
              <li style={bulletPointStyle}>
                [Achievement or responsibility with quantifiable results]
              </li>
              <li style={bulletPointStyle}>
                [Specific accomplishment using action verbs and metrics]
              </li>
              <li style={bulletPointStyle}>
                [Technical skills and technologies utilized]
              </li>
            </ul>
          </div>

          <div style={{ marginBottom: '10px' }}>
            <div style={{ fontSize: '9pt', fontWeight: 'bold' }}>
              [Previous Job Title] | [Previous Company]
            </div>
            <div style={{ fontSize: '8pt', color: '#666', marginBottom: '5px' }}>
              [Previous Start Date] - [Previous End Date] | [Previous Location]
            </div>
            <ul style={{ margin: '0', paddingLeft: '15px' }}>
              <li style={bulletPointStyle}>
                [Previous achievement with specific outcomes]
              </li>
              <li style={bulletPointStyle}>
                [Leadership or technical contribution]
              </li>
            </ul>
          </div>

          {/* Technical Skills */}
          <div style={sectionHeaderStyle}>TECHNICAL SKILLS</div>
          <div style={{ fontSize: '9pt', marginBottom: '10px' }}>
            <strong>Programming Languages:</strong> [List your programming languages]<br />
            <strong>Frameworks & Tools:</strong> [List frameworks, tools, and technologies]<br />
            <strong>Databases:</strong> [List database systems]<br />
            <strong>Methodologies:</strong> [Agile, Scrum, etc.]
          </div>

          {/* Projects */}
          <div style={sectionHeaderStyle}>PROJECTS</div>

          <div style={{ marginBottom: '10px' }}>
            <div style={{ fontSize: '9pt', fontWeight: 'bold' }}>
              [Project Name] | [Technologies Used]
            </div>
            <div style={{ fontSize: '8pt', color: '#666', marginBottom: '5px' }}>
              [Project Duration] | Advisor: [Advisor Name]
            </div>
            <ul style={{ margin: '0', paddingLeft: '15px' }}>
              <li style={bulletPointStyle}>
                [Project description and your specific contributions]
              </li>
              <li style={bulletPointStyle}>
                [Technologies implemented and results achieved]
              </li>
            </ul>
          </div>

          {/* Additional Experience */}
          <div style={sectionHeaderStyle}>ADDITIONAL EXPERIENCE</div>
          <ul style={{ margin: '0', paddingLeft: '15px' }}>
            <li style={bulletPointStyle}>
              [Volunteer work, internships, or relevant activities]
            </li>
            <li style={bulletPointStyle}>
              [Leadership roles or community involvement]
            </li>
          </ul>

          {/* Honors and Awards */}
          <div style={sectionHeaderStyle}>HONORS AND AWARDS</div>
          <ul style={{ margin: '0', paddingLeft: '15px' }}>
            <li style={bulletPointStyle}>
              [Award or recognition] - [Issuing Organization], [Year]
            </li>
            <li style={bulletPointStyle}>
              [Scholarship or achievement] - [Details]
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TemplatePreview;

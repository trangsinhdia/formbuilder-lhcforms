import React from 'react';

interface LabelProps {
  htmlFor: string;
  title: string;
  helpMessage?: string;
  className?: string;
}

const Label: React.FC<LabelProps> = ({
  htmlFor,
  title,
  helpMessage,
  className = ''
}) => {
  return (
    <label htmlFor={htmlFor} className={className}>
      {title}
      {helpMessage && (
        <span 
          className="ms-1 text-muted" 
          title={helpMessage}
          role="tooltip"
        >
          <i className="bi bi-question-circle"></i>
        </span>
      )}
    </label>
  );
};

export default Label;
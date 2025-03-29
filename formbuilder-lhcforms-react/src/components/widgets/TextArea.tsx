import React, { useEffect, useState } from 'react';
import { useFormContext } from '../../contexts/FormContext';
import Label from './Label';

interface TextAreaProps {
  id: string;
  name: string;
  schema: {
    widget: {
      id: string;
    };
    title: string;
    description?: string;
    readOnly?: boolean;
    placeholder?: string;
    maxLength?: number;
    minLength?: number;
    isRequired?: boolean;
    disabled?: boolean;
  };
  value: string;
  onChange: (value: string) => void;
  labelPosition?: 'left' | 'top';
  nolabel?: boolean;
  labelClasses?: string;
  controlClasses?: string;
}

const TextArea: React.FC<TextAreaProps> = ({
  id,
  name,
  schema,
  value,
  onChange,
  labelPosition = 'top',
  nolabel = false,
  labelClasses = '',
  controlClasses = 'form-control form-control-sm'
}) => {
  const [errors, setErrors] = useState<Array<{ code: string; message: string }>>([]);
  const { validateField } = useFormContext();

  useEffect(() => {
    if (value) {
      const validationErrors = validateField(name, value, schema);
      setErrors(validationErrors);
    } else {
      setErrors([]);
    }
  }, [value, name, schema, validateField]);

  if (schema.widget.id === 'hidden') {
    return (
      <input
        name={name}
        type="hidden"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  return (
    <div className={`${labelPosition === 'left' ? 'row' : ''} m-0`}>
      {!nolabel && (
        <Label
          htmlFor={id}
          title={schema.title}
          helpMessage={schema.description}
          className={`form-label ${labelClasses}`}
        />
      )}
      <div className="col p-0 position-relative">
        <textarea
          name={name}
          readOnly={schema.readOnly}
          className={controlClasses}
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={schema.placeholder}
          maxLength={schema.maxLength}
          minLength={schema.minLength}
          required={schema.isRequired}
          disabled={schema.disabled}
        />
        {errors.map((error, index) => (
          <small
            key={index}
            className="text-danger form-text"
            role="alert"
          >
            {error.message}
          </small>
        ))}
      </div>
    </div>
  );
};

export default TextArea;
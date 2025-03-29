import React, { useEffect, useState } from 'react';
import { useFormContext } from '../../contexts/FormContext';
import Label from './Label';

interface StringInputProps {
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
    pattern?: string;
  };
  value: string;
  onChange: (value: string) => void;
  labelPosition?: 'left' | 'top';
  nolabel?: boolean;
  labelClasses?: string;
  controlClasses?: string;
}

// Pattern error messages mapping
const PATTERN_MESSAGES = {
  '^\\S*$': 'Spaces and other whitespace characters are not allowed in this field.',
  '^[^\\s]+(\\s[^\\s]+)*$': 'Spaces are not allowed at the beginning or end.',
  '^([0-9]([0-9]([0-9][1-9]|[1-9]0)|[1-9]00)|[1-9]000)(-(0[1-9]|1[0-2])(-(0[1-9]|[1-2][0-9]|3[0-1]))?)?$': 'Valid format is yyyy-MM-dd.',
  '^([0-9]([0-9]([0-9][1-9]|[1-9]0)|[1-9]00)|[1-9]000)(-(0[1-9]|1[0-2])(-(0[1-9]|[1-2][0-9]|3[0-1])(T([01][0-9]|2[0-3]):[0-5][0-9]:([0-5][0-9]|60)(\\.[0-9]+)?(Z|(\\+|-)((0[0-9]|1[0-3]):[0-5][0-9]|14:00)))?)?)?$': 'Valid format is yyyy-MM-dd hh:mm:ss (AM|PM).'
};

const StringInput: React.FC<StringInputProps> = ({
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
      setErrors(validationErrors.map(error => ({
        code: error.code,
        message: error.code === 'PATTERN' && schema.pattern
          ? PATTERN_MESSAGES[schema.pattern] || error.message
          : error.message
      })));
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
        <input
          name={name}
          readOnly={schema.widget.id !== 'color' && schema.readOnly}
          className={controlClasses}
          type={!schema.widget.id || schema.widget.id === 'string' ? 'text' : schema.widget.id}
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

export default StringInput;
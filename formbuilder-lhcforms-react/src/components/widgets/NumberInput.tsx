import React from 'react';
import Label from './Label';

interface NumberInputProps {
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
    minimum?: number;
    maximum?: number;
    maxLength?: number;
    minLength?: number;
  };
  value: number | null;
  onChange: (value: number | null) => void;
  labelPosition?: 'left' | 'top';
  nolabel?: boolean;
  labelWidthClass?: string;
  controlWidthClass?: string;
}

const NumberInput: React.FC<NumberInputProps> = ({
  id,
  name,
  schema,
  value,
  onChange,
  labelPosition = 'top',
  nolabel = false,
  labelWidthClass = '',
  controlWidthClass = ''
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (newValue === '') {
      onChange(null);
    } else {
      const numValue = parseFloat(newValue);
      if (!isNaN(numValue)) {
        onChange(numValue);
      }
    }
  };

  if (schema.widget.id === 'hidden') {
    return (
      <input
        name={name}
        type="hidden"
        value={value?.toString() || ''}
        onChange={(e) => handleChange(e)}
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
          className={`${labelWidthClass} ps-0 pe-1`}
        />
      )}
      <input
        id={id}
        name={name}
        type="number"
        value={value?.toString() || ''}
        onChange={handleChange}
        readOnly={schema.readOnly}
        placeholder={schema.placeholder}
        min={schema.minimum}
        max={schema.maximum}
        maxLength={schema.maxLength}
        minLength={schema.minLength}
        step="any"
        className={`form-control ${controlWidthClass}`}
      />
    </div>
  );
};

export default NumberInput;
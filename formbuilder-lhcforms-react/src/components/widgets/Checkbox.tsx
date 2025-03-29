import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import Tooltip from '@mui/material/Tooltip';

interface CheckboxProps {
  id: string;
  name: string;
  schema: {
    type?: string;
    title?: string;
    description?: string;
    readOnly?: boolean;
    items?: {
      oneOf: Array<{
        enum: string[];
        description: string;
      }>;
    };
  };
  value: boolean | string[];
  onChange: (value: boolean | string[]) => void;
  nolabel?: boolean;
  lfbClass?: string;
}

const Checkbox: React.FC<CheckboxProps> = ({
  id,
  name,
  schema,
  value,
  onChange,
  nolabel = false,
  lfbClass = 'text-center'
}) => {
  // For array type checkboxes, maintain checked state
  const checked = React.useMemo(() => {
    if (Array.isArray(value)) {
      return value.reduce((acc, val) => {
        acc[val] = true;
        return acc;
      }, {} as Record<string, boolean>);
    }
    return {};
  }, [value]);

  // Handle single checkbox change
  const handleSingleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.checked);
  };

  // Handle array checkbox change
  const handleArrayChange = (optionValue: string) => {
    if (!Array.isArray(value)) return;
    
    const newValue = checked[optionValue]
      ? value.filter(v => v !== optionValue)
      : [...value, optionValue];
    
    onChange(newValue);
  };

  if (schema.type === 'array') {
    return (
      <div className="widget">
        {schema.items?.oneOf.map((option) => (
          <div key={option.enum[0]} className="checkbox">
            <label className="horizontal control-label">
              <input
                name={name}
                value={option.enum[0]}
                type="checkbox"
                disabled={schema.readOnly}
                checked={checked[option.enum[0]] || false}
                onChange={() => handleArrayChange(option.enum[0])}
                id={`${id}.${option.enum[0]}`}
              />
              {option.description}
            </label>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="widget">
      <div className={`form-check ${lfbClass}`}>
        <input
          className="form-check-input"
          name={name}
          id={id}
          type="checkbox"
          disabled={schema.readOnly}
          checked={value as boolean}
          onChange={handleSingleChange}
          // Handle indeterminate state
          ref={input => {
            if (input) {
              input.indeterminate = value !== false && value !== true;
            }
          }}
        />
        {schema.readOnly && (
          <input
            name={name}
            type="hidden"
            value={String(value)}
            readOnly
          />
        )}
        {!nolabel && schema.title && (
          <label htmlFor={id} className="form-check-label control-label">
            {schema.title}
            {schema.description && (
              <Tooltip
                title={schema.description}
                aria-label={`Tooltip for ${schema.title}: ${schema.description}`}
              >
                <button className="btn border-0 m-0 p-0">
                  <FontAwesomeIcon icon={faInfoCircle} />
                </button>
              </Tooltip>
            )}
          </label>
        )}
      </div>
    </div>
  );
};

export default Checkbox;
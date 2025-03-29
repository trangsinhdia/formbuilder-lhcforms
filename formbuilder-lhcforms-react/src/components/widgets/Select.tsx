import React, { useEffect, useState } from 'react';
import { useFormContext } from '../../contexts/FormContext';
import { useFormService } from '../../services/FormService';
import Label from './Label';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faInfoCircle } from '@fortawesome/free-solid-svg-icons';

interface SelectProps {
  id: string;
  name: string;
  schema: {
    widget: {
      id: string;
      selectOptionsMap?: {
        map?: Record<string, string>;
        remove?: string[];
        validateType?: boolean;
        addEmptyOption?: boolean;
      };
    };
    title: string;
    description?: string;
    readOnly?: boolean;
    type?: string;
    enum?: string[];
    oneOf?: Array<{
      enum: string[];
      description: string;
    }>;
    items?: {
      oneOf: Array<{
        enum: string[];
        description: string;
        readOnly?: boolean;
      }>;
    };
    isRequired?: boolean;
  };
  value: string | string[];
  onChange: (value: string | string[]) => void;
  labelPosition?: 'left' | 'top';
  nolabel?: boolean;
  labelClasses?: string;
  controlClasses?: string;
}

interface Option {
  value: string | null;
  label: string;
}

const Select: React.FC<SelectProps> = ({
  id,
  name,
  schema,
  value,
  onChange,
  labelPosition = 'top',
  nolabel = false,
  labelClasses = '',
  controlClasses = 'col'
}) => {
  const [errors, setErrors] = useState<Array<{ code: string; message: string }>>([]);
  const [allowedOptions, setAllowedOptions] = useState<Option[]>([]);
  const { validateField } = useFormContext();
  const { hasSubItems } = useFormService();

  const mapOption = (opt: string): Option => {
    const ret = { value: opt, label: opt };
    if (schema.widget.selectOptionsMap?.map?.[opt]) {
      ret.label = schema.widget.selectOptionsMap.map[opt];
    }
    return ret;
  };

  const isIncluded = (opt: string): boolean => {
    return !(schema.widget.selectOptionsMap?.remove?.includes(opt));
  };

  const isTypeAllowed = (opt: string): boolean => {
    return (
      !schema.widget.selectOptionsMap?.validateType ||
      opt !== 'display' ||
      !hasSubItems()
    );
  };

  useEffect(() => {
    if (schema.enum) {
      const options = schema.enum
        .map(mapOption)
        .filter(opt => opt.value && isIncluded(opt.value) && isTypeAllowed(opt.value));

      if (schema.widget.selectOptionsMap?.addEmptyOption) {
        options.unshift({ value: null, label: 'None' });
      }

      setAllowedOptions(options);
    }
  }, [schema]);

  useEffect(() => {
    if (value) {
      const validationErrors = validateField(name, value, schema);
      setErrors(validationErrors);
    } else {
      setErrors([]);
    }
  }, [value, name, schema, validateField]);

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    if (schema.type === 'array') {
      const selectedOptions = Array.from(event.target.selectedOptions, option => option.value);
      onChange(selectedOptions);
    } else {
      onChange(event.target.value);
    }
  };

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
      <div className={controlClasses}>
        {schema.type !== 'array' ? (
          <select
            name={name}
            id={id}
            value={value as string}
            onChange={handleChange}
            className={`form-select form-select-sm ${errors.length ? 'is-invalid' : ''}`}
            aria-invalid={errors.length > 0}
            disabled={schema.readOnly}
          >
            {schema.oneOf ? (
              schema.oneOf.map((option, index) => (
                <option key={index} value={option.enum[0]}>
                  {option.description}
                </option>
              ))
            ) : (
              allowedOptions.map((option, index) => (
                <option key={index} value={option.value || ''}>
                  {option.label}
                </option>
              ))
            )}
          </select>
        ) : (
          <select
            name={name}
            id={id}
            multiple
            value={value as string[]}
            onChange={handleChange}
            className={`form-select ${errors.length ? 'is-invalid' : ''}`}
            aria-invalid={errors.length > 0}
            disabled={schema.readOnly}
          >
            {schema.items?.oneOf.map((option, index) => (
              <option
                key={index}
                value={option.enum[0]}
                disabled={option.readOnly}
              >
                {option.description}
              </option>
            ))}
          </select>
        )}

        {errors.map((error, index) => (
          <div key={index} className="invalid-feedback d-block">
            <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
            {error.message}
          </div>
        ))}

        {schema.readOnly && (
          <input
            name={name}
            type="hidden"
            value={Array.isArray(value) ? value.join(',') : value}
            onChange={() => {}}
          />
        )}
      </div>
    </div>
  );
};

export default Select;
import React, { useEffect, useState } from 'react';
import { Label } from './Label';
import { useFormContext } from '../../contexts/FormContext';

interface BooleanRadioProps {
  schema: {
    title: string;
    description?: string;
    readOnly?: boolean;
    widget?: {
      optionLabels?: [string, string][];
    };
  };
  value: boolean | null;
  onChange: (value: boolean | null) => void;
  nolabel?: boolean;
  labelPosition?: 'left' | 'top';
  controlClasses?: string;
  labelClasses?: string;
}

export const BooleanRadio: React.FC<BooleanRadioProps> = ({
  schema,
  value,
  onChange,
  nolabel = false,
  labelPosition = 'left',
  controlClasses = '',
  labelClasses = ''
}) => {
  const id = React.useId();
  const [options, setOptions] = useState<Map<string, string>>(
    new Map([['false', 'No'], ['true', 'Yes'], ['null', 'Unspecified']])
  );

  useEffect(() => {
    if (schema.widget?.optionLabels) {
      // Overwrite default map from widget definition
      setOptions(new Map(schema.widget.optionLabels));
    }
  }, [schema.widget?.optionLabels]);

  const optionsKeys = Array.from(options.keys());

  return (
    <div className={`widget ${labelPosition === 'left' ? 'row' : ''} m-0`}>
      {!nolabel && (
        <Label
          title={schema.title}
          helpMessage={schema.description}
          className={labelClasses}
          labelId={`label${id}`}
        />
      )}

      <div
        aria-labelledby={`label${id}`}
        className={`${controlClasses} m-auto ms-0`}
        role="radiogroup"
      >
        {optionsKeys.map((key) => {
          const radioValue = key === 'true' ? true : key === 'false' ? false : null;
          return (
            <React.Fragment key={key}>
              <input
                type="radio"
                className="btn-check"
                name={id}
                id={`booleanRadio_${key}${id}`}
                value={key}
                checked={value === radioValue}
                onChange={() => onChange(radioValue)}
                disabled={schema.readOnly}
              />
              <label
                className="btn btn-outline-success m-0"
                htmlFor={`booleanRadio_${key}${id}`}
              >
                {options.get(key)}
              </label>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
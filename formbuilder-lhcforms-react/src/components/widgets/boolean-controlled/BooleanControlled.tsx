import React from 'react';
import Label from '../Label';

interface BooleanControlledProps {
  value: boolean;
  onChange: (value: boolean) => void;
  label: string;
  labelPosition?: 'left' | 'top';
  helpMessage?: string;
  labelClasses?: string;
  controlClasses?: string;
  disabled?: boolean;
}

let idCounter = 0;

/**
 * A boolean control typically to trigger hide and show of a sibling component.
 */
const BooleanControlled: React.FC<BooleanControlledProps> = ({
  value,
  onChange,
  label,
  labelPosition = 'left',
  helpMessage,
  labelClasses,
  controlClasses,
  disabled = false
}) => {
  const id = React.useMemo(() => `booleanControlled_${idCounter++}`, []);

  return (
    <div className={`widget ${labelPosition === 'left' ? 'row' : ''} m-0`}>
      <Label
        title={label}
        htmlFor={id}
        helpMessage={helpMessage}
        className={labelClasses}
        labelId={`label_${id}`}
      />

      <div 
        className={controlClasses}
        role="radiogroup"
        aria-labelledby={`label_${id}`}
        id={id}
      >
        {['No', 'Yes'].map((option) => (
          <React.Fragment key={option}>
            <input
              autoComplete="off"
              id={`${id}_${option}`}
              name={id}
              className="btn-check"
              checked={value === (option === 'Yes')}
              onChange={() => onChange(option === 'Yes')}
              value={option === 'Yes' ? 'true' : 'false'}
              type="radio"
              disabled={disabled}
            />
            <label 
              className="btn btn-outline-success" 
              htmlFor={`${id}_${option}`}
            >
              {option}
            </label>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default BooleanControlled;
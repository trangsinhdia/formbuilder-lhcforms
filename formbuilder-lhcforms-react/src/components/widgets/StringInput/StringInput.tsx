import React, { useEffect, useState } from 'react';
import { Label } from '../Label/Label';
import { useFormContext } from '../../../contexts/FormContext';
import { ErrorMessage } from '../ErrorMessage/ErrorMessage';

interface StringInputProps {
  id: string;
  name: string;
  schema: {
    widget: {
      id: string;
    };
    title?: string;
    description?: string;
    readOnly?: boolean;
    placeholder?: string;
    maxLength?: number;
    minLength?: number;
    isRequired?: boolean;
    disabled?: boolean;
  };
  formProperty: any;
  control: any;
  nolabel?: boolean;
  labelPosition?: 'left' | 'top';
  labelClasses?: string;
  controlClasses?: string;
}

interface ErrorType {
  code: string;
  originalMessage: string;
  modifiedMessage?: string;
}

export const StringInput: React.FC<StringInputProps> = ({
  id,
  name,
  schema,
  formProperty,
  control,
  nolabel = false,
  labelPosition = 'top',
  labelClasses = '',
  controlClasses = 'form-control form-control-sm'
}) => {
  const [errors, setErrors] = useState<ErrorType[]>([]);
  const { announceError } = useFormContext();

  // Pattern error messages mapping
  const modifiedMessages = {
    PATTERN: [
      {
        pattern: '^\\S*$',
        message: 'Spaces and other whitespace characters are not allowed in this field.'
      },
      {
        pattern: '^[^\\s]+(\\s[^\\s]+)*$',
        message: 'Spaces are not allowed at the beginning or end.'
      },
      {
        pattern: '^([0-9]([0-9]([0-9][1-9]|[1-9]0)|[1-9]00)|[1-9]000)(-(0[1-9]|1[0-2])(-(0[1-9]|[1-2][0-9]|3[0-1]))?)?$',
        message: 'Valid format is yyyy-MM-dd.'
      },
      {
        pattern: '^([0-9]([0-9]([0-9][1-9]|[1-9]0)|[1-9]00)|[1-9]000)(-(0[1-9]|1[0-2])(-(0[1-9]|[1-2][0-9]|3[0-1])(T([01][0-9]|2[0-3]):[0-5][0-9]:([0-5][0-9]|60)(\\.[0-9]+)?(Z|(\\+|-)((0[0-9]|1[0-3]):[0-5][0-9]|14:00)))?)?)?$',
        message: 'Valid format is yyyy-MM-dd hh:mm:ss (AM|PM).'
      }
    ]
  };

  useEffect(() => {
    const subscription = formProperty.errorsChanges.subscribe((newErrors: any[]) => {
      if (newErrors?.length) {
        // Remove duplicate errors
        const errorsObj: Record<string, any> = {};
        newErrors.forEach(error => {
          if (!errorsObj[error.code]) {
            errorsObj[error.code] = error;
          }
        });

        const processedErrors = Object.values(errorsObj).map((error: any) => {
          const modifiedMessage = error.code === 'PATTERN'
            ? getModifiedErrorForPatternMismatch(error.params[0])
            : modifiedMessages[error.code];
          return {
            code: error.code,
            originalMessage: error.message,
            modifiedMessage
          };
        });

        setErrors(processedErrors);
      } else {
        setErrors([]);
      }
    });

    return () => subscription.unsubscribe();
  }, [formProperty]);

  const getModifiedErrorForPatternMismatch = (pattern: string): string | undefined => {
    const messageObj = modifiedMessages.PATTERN.find(el => el.pattern === pattern);
    return messageObj?.message;
  };

  const handleFocus = () => {
    if (errors.length > 0) {
      const combinedErrorMessage = errors.map(error => 
        error.modifiedMessage || error.originalMessage
      ).join(' ');
      announceError(combinedErrorMessage);
    }
  };

  if (schema.widget.id === 'hidden') {
    return (
      <input
        name={name}
        type="hidden"
        value={control.value}
        onChange={e => control.onChange(e.target.value)}
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
          value={control.value || ''}
          onChange={e => control.onChange(e.target.value)}
          placeholder={schema.placeholder}
          maxLength={schema.maxLength}
          minLength={schema.minLength}
          required={schema.isRequired}
          disabled={schema.disabled}
          onFocus={handleFocus}
        />
        {formProperty.value && errors.map((error, index) => (
          <ErrorMessage
            key={index}
            message={error.modifiedMessage || error.originalMessage}
          />
        ))}
      </div>
    </div>
  );
};
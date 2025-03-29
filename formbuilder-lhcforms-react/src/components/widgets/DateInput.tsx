import React, { useEffect, useState, useRef } from 'react';
import DatePicker from 'react-datepicker';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendar } from '@fortawesome/free-solid-svg-icons';
import { DateUtil } from '../../utils/DateUtil';
import Label from './Label';
import 'react-datepicker/dist/react-datepicker.css';

interface DateInputProps {
  id: string;
  name: string;
  schema: {
    widget: {
      id: string;
      placeholder?: string;
      required?: boolean;
    };
    title: string;
    description?: string;
    readOnly?: boolean;
    disabled?: boolean;
  };
  value: string;
  onChange: (value: string) => void;
  labelPosition?: 'left' | 'top';
  nolabel?: boolean;
  labelClasses?: string;
  controlClasses?: string;
}

const DateInput: React.FC<DateInputProps> = ({
  id,
  name,
  schema,
  value,
  onChange,
  labelPosition = 'top',
  nolabel = false,
  labelClasses = '',
  controlClasses = ''
}) => {
  const [errors, setErrors] = useState<Array<{ code: string; message: string }>>([]);
  const [inputValue, setInputValue] = useState(value || '');
  const inputRef = useRef<HTMLInputElement>(null);

  // Convert ISO string to Date object for DatePicker
  const getDateValue = (): Date | null => {
    if (!value) return null;
    const dateTime = DateUtil.parseISOToDateTime(value, true);
    if (!dateTime.dateStruct) return null;
    const { year, month, day } = dateTime.dateStruct;
    return new Date(year, month - 1, day);
  };

  // Handle date change from DatePicker
  const handleDateChange = (date: Date | null) => {
    if (!date) {
      onChange('');
      setInputValue('');
      return;
    }

    const dateStruct = {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate()
    };

    const isoString = DateUtil.formatToISO({ dateStruct, timeStruct: null, millis: NaN });
    onChange(isoString);
    setInputValue(DateUtil.formatToLocal({ dateStruct, timeStruct: null, millis: NaN }));
  };

  // Handle manual input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // Parse the input value
    const dateTime = DateUtil.parseLocalToDateTime(newValue, true);
    if (dateTime.dateStruct) {
      const isoString = DateUtil.formatToISO(dateTime);
      onChange(isoString);
      setErrors([]);
    } else {
      setErrors([{ code: 'FORMAT', message: 'Invalid date format' }]);
    }
  };

  // Handle blur event to validate and format the input
  const handleBlur = () => {
    if (inputValue) {
      const dateTime = DateUtil.parseLocalToDateTime(inputValue, true);
      if (!dateTime.dateStruct) {
        setInputValue('');
        onChange('');
        setErrors([]);
      }
    }
  };

  // Set today's date
  const setToday = () => {
    const today = new Date();
    handleDateChange(today);
  };

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
      <div className={`position-relative input-group-sm px-0 ${controlClasses}`}>
        <div className="input-group input-group-sm">
          <DatePicker
            id={id}
            name={name}
            selected={getDateValue()}
            onChange={handleDateChange}
            dateFormat="yyyy-MM-dd"
            className="form-control"
            customInput={
              <input
                ref={inputRef}
                value={inputValue}
                onChange={handleInputChange}
                onBlur={handleBlur}
                placeholder={schema.widget.placeholder}
                readOnly={schema.readOnly}
                required={schema.widget.required}
                disabled={schema.disabled}
              />
            }
          />
          <button
            className="btn btn-outline-secondary py-0"
            onClick={() => inputRef.current?.click()}
            aria-label={`Date picker for ${schema.title}`}
            type="button"
          >
            <FontAwesomeIcon icon={faCalendar} aria-hidden="true" />
          </button>
        </div>

        {errors.map((error, index) => (
          <small
            key={index}
            className="text-danger form-text pe-1"
            role="alert"
          >
            {error.message}
          </small>
        ))}

        <div className="text-center">
          <button
            onClick={setToday}
            className="btn btn-sm btn-link"
            type="button"
          >
            Today
          </button>
        </div>
      </div>
    </div>
  );
};

export default DateInput;
import React, { useEffect, useRef, useState } from 'react';
import { Label } from './Label';
import { DateUtil, DateTime as DateTimeType, DateStruct, TimeStruct } from '../../utils/dateUtil';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendar } from '@fortawesome/free-solid-svg-icons';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface DateTimeProps {
  schema: {
    title: string;
    description?: string;
    readOnly?: boolean;
    disabled?: boolean;
    widget: {
      id?: string;
      placeholder?: string;
      required?: boolean;
    };
  };
  value: string;
  onChange: (value: string | null) => void;
  nolabel?: boolean;
  labelPosition?: 'left' | 'top';
  controlClasses?: string;
  labelClasses?: string;
  errors?: Array<{ modifiedMessage?: string; originalMessage: string }>;
}

export const DateTime: React.FC<DateTimeProps> = ({
  schema,
  value,
  onChange,
  nolabel = false,
  labelPosition = 'left',
  controlClasses = '',
  labelClasses = '',
  errors = []
}) => {
  const id = React.useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dateTime, setDateTime] = useState<DateTimeType>({ dateStruct: null, timeStruct: null });
  const [includeTime, setIncludeTime] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const dTime = DateUtil.parseISOToDateTime(value);
    setDateTime(dTime);
    setIncludeTime(!(dTime.dateStruct && !dTime.timeStruct));
  }, [value]);

  const updateValue = (newDateTime: DateTimeType) => {
    const val = DateUtil.formatToISO(newDateTime);
    onChange(val || null);
  };

  const handleDateSelect = (date: Date) => {
    const newDateTime = {
      ...dateTime,
      dateStruct: {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate()
      }
    };
    setDateTime(newDateTime);
    updateValue(newDateTime);
  };

  const handleTimeChange = (time: Date) => {
    if (!includeTime) return;

    const newDateTime = {
      ...dateTime,
      timeStruct: {
        hour: time.getHours(),
        minute: time.getMinutes(),
        second: time.getSeconds()
      },
      millis: time.getMilliseconds()
    };
    setDateTime(newDateTime);
    updateValue(newDateTime);
  };

  const handleNow = () => {
    setIncludeTime(true);
    const now = new Date();
    const newDateTime: DateTimeType = {
      dateStruct: {
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        day: now.getDate()
      },
      timeStruct: {
        hour: now.getHours(),
        minute: now.getMinutes(),
        second: now.getSeconds()
      },
      millis: now.getMilliseconds()
    };
    setDateTime(newDateTime);
    updateValue(newDateTime);
  };

  const handleToday = () => {
    const today = new Date();
    const newDateTime: DateTimeType = {
      ...dateTime,
      dateStruct: {
        year: today.getFullYear(),
        month: today.getMonth() + 1,
        day: today.getDate()
      }
    };
    setDateTime(newDateTime);
    updateValue(newDateTime);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.trim().length > 0) {
      const d = new Date(value.trim());
      if (DateUtil.isValidDate(d)) {
        const newDateTime = DateUtil.parseLocalToDateTime(value);
        setDateTime(newDateTime);
        updateValue(newDateTime);
      }
    }
  };

  const getDateFromDateTime = (): Date | null => {
    if (!dateTime.dateStruct) return null;
    return new Date(
      dateTime.dateStruct.year,
      dateTime.dateStruct.month - 1,
      dateTime.dateStruct.day,
      dateTime.timeStruct?.hour || 0,
      dateTime.timeStruct?.minute || 0,
      dateTime.timeStruct?.second || 0,
      dateTime.millis || 0
    );
  };

  return (
    <div className={`${labelPosition === 'left' ? 'row' : ''} m-0`}>
      {!nolabel && (
        <Label
          title={schema.title}
          helpMessage={schema.description}
          className={labelClasses}
          labelId={`label${id}`}
          htmlFor={id}
        />
      )}
      <div className={`position-relative input-group-sm px-0 ${controlClasses}`}>
        <div className="input-group input-group-sm">
          <DatePicker
            id={id}
            ref={inputRef}
            className="form-control"
            selected={getDateFromDateTime()}
            onChange={(date: Date) => handleDateSelect(date)}
            onTimeChange={(time: Date) => handleTimeChange(time)}
            showTimeSelect={includeTime}
            showTimeSecond={includeTime}
            dateFormat={includeTime ? "MM/dd/yyyy h:mm:ss aa" : "MM/dd/yyyy"}
            timeFormat="h:mm:ss aa"
            placeholderText={schema.widget.placeholder}
            required={schema.widget.required}
            disabled={schema.disabled}
            readOnly={schema.readOnly && schema.widget.id !== 'color'}
            open={isOpen}
            onInputClick={() => setIsOpen(true)}
            onClickOutside={() => setIsOpen(false)}
            customInput={
              <input
                onChange={handleInputChange}
                className="form-control"
              />
            }
          />
          <button
            className="btn btn-outline-secondary py-0"
            aria-label={`Date time picker for ${schema.title}`}
            onClick={() => setIsOpen(!isOpen)}
          >
            <FontAwesomeIcon icon={faCalendar} aria-hidden="true" />
          </button>
        </div>

        {errors.slice().reverse().map((error, index) => (
          value && (
            <small
              key={index}
              className="text-danger form-text pe-1"
              role="alert"
            >
              {error.modifiedMessage || error.originalMessage}
            </small>
          )
        ))}

        {isOpen && (
          <div className="mt-2">
            <div className="text-center">
              <button onClick={handleToday} className="btn btn-sm btn-link">
                Today
              </button>
            </div>
            <hr className="my-0" />
            <div className="container">
              <span className="d-block text-center">Time</span>
              <div className="d-flex">
                <div className="flex-grow-1">
                  <input
                    id={`ignoreTimeCheckBox${id}`}
                    type="checkbox"
                    checked={includeTime}
                    onChange={(e) => {
                      setIncludeTime(e.target.checked);
                      if (!e.target.checked) {
                        const newDateTime = { ...dateTime, timeStruct: null };
                        setDateTime(newDateTime);
                        updateValue(newDateTime);
                      }
                    }}
                    className="me-1 form-check-input form-check-inline"
                  />
                  <label htmlFor={`ignoreTimeCheckBox${id}`}>Include time</label>
                </div>
                <div>
                  <button className="btn btn-sm btn-link" onClick={handleNow}>
                    Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
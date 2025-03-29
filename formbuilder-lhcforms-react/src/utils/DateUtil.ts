interface DateStruct {
  year: number;
  month: number;
  day: number;
}

interface TimeStruct {
  hour: number;
  minute: number;
  second: number;
}

interface DateTimeStruct {
  dateStruct: DateStruct | null;
  timeStruct: TimeStruct | null;
  millis: number;
}

export class DateUtil {
  static isValidDate(date: Date): boolean {
    return date instanceof Date && !isNaN(date.getTime());
  }
  
  static parseISOToDateTime(value: string | null, dateOnly = false): DateTimeStruct {
    const result: DateTimeStruct = {
      dateStruct: null,
      timeStruct: null,
      millis: NaN
    };

    if (!value) return result;

    const match = value.match(/^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?/);
    if (match) {
      const [_, year, month, day] = match;
      result.dateStruct = {
        year: parseInt(year),
        month: month ? parseInt(month) : 1,
        day: day ? parseInt(day) : 1
      };
    }

    if (!dateOnly) {
      const timeMatch = value.match(/T(\d{2}):(\d{2}):(\d{2})/);
      if (timeMatch) {
        const [_, hour, minute, second] = timeMatch;
        result.timeStruct = {
          hour: parseInt(hour),
          minute: parseInt(minute),
          second: parseInt(second)
        };
      }
    }

    return result;
  }

  static parseLocalToDateTime(value: string, dateOnly = false): DateTimeStruct {
    const result: DateTimeStruct = {
      dateStruct: null,
      timeStruct: null,
      millis: NaN
    };

    if (!value) return result;

    const parts = value.split(' ');
    const datePart = parts[0];
    const timePart = parts[1];

    const dateMatch = datePart.match(/^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?/);
    if (dateMatch) {
      const [_, year, month, day] = dateMatch;
      result.dateStruct = {
        year: parseInt(year),
        month: month ? parseInt(month) : 1,
        day: day ? parseInt(day) : 1
      };
    }

    if (!dateOnly && timePart) {
      const timeMatch = timePart.match(/(\d{2}):(\d{2}):(\d{2})/);
      if (timeMatch) {
        const [_, hour, minute, second] = timeMatch;
        result.timeStruct = {
          hour: parseInt(hour),
          minute: parseInt(minute),
          second: parseInt(second)
        };
      }
    }

    return result;
  }

  static formatToISO(dateTime: DateTimeStruct): string {
    if (!dateTime.dateStruct) return '';

    const { year, month, day } = dateTime.dateStruct;
    let result = `${year}`;

    if (month) {
      result += `-${month.toString().padStart(2, '0')}`;
      if (day) {
        result += `-${day.toString().padStart(2, '0')}`;
      }
    }

    if (dateTime.timeStruct) {
      const { hour, minute, second } = dateTime.timeStruct;
      result += `T${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:${second.toString().padStart(2, '0')}`;
    }

    return result;
  }

  static formatToLocal(dateTime: DateTimeStruct): string {
    if (!dateTime.dateStruct) return '';

    const { year, month, day } = dateTime.dateStruct;
    let result = `${year}`;

    if (month) {
      result += `-${month.toString().padStart(2, '0')}`;
      if (day) {
        result += `-${day.toString().padStart(2, '0')}`;
      }
    }

    if (dateTime.timeStruct) {
      const { hour, minute, second } = dateTime.timeStruct;
      result += ` ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:${second.toString().padStart(2, '0')}`;
    }

    return result;
  }
}
import { useMemo } from 'react';
import { StringInput } from '../components/widgets/StringInput';
import { NumberInput } from '../components/widgets/NumberInput';
import { BooleanRadio } from '../components/widgets/BooleanRadio';
import { DateInput } from '../components/widgets/DateInput';
import { DateTime } from '../components/widgets/DateTime';
import { TextArea } from '../components/widgets/TextArea';
import { Select } from '../components/widgets/Select';
import { Checkbox } from '../components/widgets/Checkbox';
import { Table } from '../components/widgets/Table';
import { Label } from '../components/widgets/Label';
import { HelpText } from '../components/widgets/help-text/HelpText';
import { AnswerOption } from '../components/widgets/answer-option';
import { AnswerValueSet } from '../components/widgets/answer-value-set/AnswerValueSet';
import { AutoComplete } from '../components/widgets/auto-complete/AutoComplete';

const defaultWidgets = {
  'string': StringInput,
  'number': NumberInput,
  'boolean': BooleanRadio,
  'date': DateInput,
  'datetime': DateTime,
  'textarea': TextArea,
  'select': Select,
  'checkbox': Checkbox,
  'table': Table,
  'label': Label,
  'help-text': HelpText,
  'answer-option': AnswerOption,
  'answer-value-set': AnswerValueSet,
  'auto-complete': AutoComplete,
};

export const useWidgetRegistry = () => {
  const registry = useMemo(() => {
    return {
      ...defaultWidgets,
      // Add any custom widgets here
    };
  }, []);

  const getWidget = (widgetId: string) => {
    return registry[widgetId] || registry['string']; // Default to string widget if not found
  };

  const registerWidget = (widgetId: string, component: React.ComponentType<any>) => {
    registry[widgetId] = component;
  };

  return {
    getWidget,
    registerWidget,
  };
};

// Export widget types for type safety
export type WidgetType = keyof typeof defaultWidgets;
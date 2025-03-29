import React, { useEffect, useState, useCallback } from 'react';
import { Table } from './Table';
import { RestrictionOperatorService } from '../../services/RestrictionOperatorService';
import { useFormContext } from '../../contexts/FormContext';

interface Restriction {
  operator: string;
  value: string;
}

interface OptionDef {
  extUrl: string;
  display: string;
}

interface OptionsDefMap {
  [key: string]: OptionDef;
}

export const Restrictions: React.FC = () => {
  const [selectedOptions, setSelectedOptions] = useState<Set<string>>(new Set());
  const [dataType, setDataType] = useState<string>('');
  const [appliedOptions, setAppliedOptions] = useState<OptionDef[]>([]);
  const [restrictions, setRestrictions] = useState<Restriction[]>([]);
  const { formProperty } = useFormContext();

  // Static definitions
  const optionsDef: OptionsDefMap = {
    maxLength: {
      extUrl: 'http://hl7.org/fhir/StructureDefinition/maxLength',
      display: 'Maximum length'
    },
    minLength: {
      extUrl: 'http://hl7.org/fhir/StructureDefinition/minLength',
      display: 'Minimum length'
    },
    regex: {
      extUrl: 'http://hl7.org/fhir/StructureDefinition/regex',
      display: 'Regex pattern'
    },
    minValue: {
      extUrl: 'http://hl7.org/fhir/StructureDefinition/minValue',
      display: 'Minimum value'
    },
    maxValue: {
      extUrl: 'http://hl7.org/fhir/StructureDefinition/maxValue',
      display: 'Maximum value'
    },
    maxSize: {
      extUrl: 'http://hl7.org/fhir/StructureDefinition/maxSize',
      display: 'Maximum size'
    },
    mimeType: {
      extUrl: 'http://hl7.org/fhir/StructureDefinition/mimeType',
      display: 'Mime type'
    }
  };

  const getOptions = useCallback((optKeys: string[]): OptionDef[] => {
    return optKeys.map((opt) => optionsDef[opt]);
  }, [optionsDef]);

  const stringOptions = getOptions(['maxLength', 'minLength', 'regex']);
  const numberOptions = getOptions(['maxValue', 'minValue', 'maxLength', 'minLength']);
  const attachOptions = getOptions(['maxSize', 'mimeType']);

  const typeToOptions = {
    decimal: numberOptions,
    integer: numberOptions,
    string: stringOptions,
    text: stringOptions,
    attachment: attachOptions
  };

  const extUrlToOptionsMap = Object.fromEntries(
    Object.entries(optionsDef).map(([k, v]) => [v.extUrl, k])
  );

  const getValueFieldName = (option: string, type: string): { fieldName: string; fieldType: string } => {
    const ret = { fieldName: '', fieldType: '' };
    switch (option) {
      case 'minLength':
      case 'maxSize':
        ret.fieldName = 'valueInteger';
        ret.fieldType = 'integer';
        break;

      case 'regex':
        ret.fieldName = 'valueString';
        ret.fieldType = 'string';
        break;

      case 'mimeType':
        ret.fieldName = 'valueCode';
        ret.fieldType = 'string';
        break;

      case 'minValue':
      case 'maxValue':
        ret.fieldName = type ? 'value' + type.charAt(0).toUpperCase() + type.slice(1) : '';
        ret.fieldType = type;
        break;
    }
    return ret;
  };

  const getValue = (value: string, valueType: string): number | string => {
    switch (valueType) {
      case 'integer':
        return parseInt(value, 10);
      case 'decimal':
        return parseFloat(value);
      case 'date':
      case 'dateTime':
      case 'time':
        return new Date(value).toISOString();
      default:
        return value;
    }
  };

  const getRestrictionValue = (ext: any): Restriction | null => {
    const operator = extUrlToOptionsMap[ext.url];
    const valField = getValueFieldName(operator, dataType);
    if (valField.fieldName) {
      return { operator, value: `${ext[valField.fieldName]}` };
    }
    return null;
  };

  const updateSelectedOptions = useCallback((newRestrictions: Restriction[]) => {
    setSelectedOptions(new Set(newRestrictions?.map(res => res.operator) || []));
  }, []);

  const getRestrictions = useCallback((rootProperty: any, appliedOpts: OptionDef[]): Restriction[] => {
    const ret: Restriction[] = [];
    const maxLength = rootProperty.getProperty('maxLength').value;
    
    if (maxLength) {
      ret.push({ operator: 'maxLength', value: `${maxLength}` });
    }

    const extensions = rootProperty.getProperty('extension').value;
    const extensionsFound = extensions?.filter((el: any) =>
      appliedOpts?.some(opt => opt.extUrl === el.url)
    );

    extensionsFound?.forEach((ext: any) => {
      const restriction = getRestrictionValue(ext);
      if (restriction) {
        ret.push(restriction);
      }
    });

    return ret;
  }, [dataType, extUrlToOptionsMap]);

  const updateRelevantExtensions = useCallback((extensions: any[], newRestrictions: Restriction[]) => {
    const indices = extensions?.reduce((acc: any, ext: any, index: number) => {
      if (Object.values(optionsDef).some(opt => opt.extUrl === ext.url)) {
        acc[ext.url] = index;
      }
      return acc;
    }, {});

    Object.entries(optionsDef).forEach(([opt, def]) => {
      const restriction = newRestrictions.find(r => r.operator === opt);
      
      if (opt === 'maxLength') {
        formProperty.root.getProperty('maxLength').setValue(
          restriction?.value ? parseInt(restriction.value, 10) : null
        );
      } else if (restriction?.value) {
        let ext = indices && indices[def.extUrl] !== undefined
          ? extensions[indices[def.extUrl]]
          : { url: def.extUrl };

        if (!indices || indices[def.extUrl] === undefined) {
          extensions.push(ext);
        }

        const fieldInfo = getValueFieldName(opt, dataType);
        ext[fieldInfo.fieldName] = getValue(restriction.value, fieldInfo.fieldType);
      } else if (indices && indices[def.extUrl] !== undefined) {
        extensions.splice(indices[def.extUrl], 1);
      }
    });
  }, [dataType, formProperty, optionsDef]);

  useEffect(() => {
    const typeSubscription = formProperty.root.getProperty('type').valueChanges.subscribe((type: string) => {
      setDataType(type);
      const newAppliedOptions = typeToOptions[type as keyof typeof typeToOptions] || [];
      setAppliedOptions(newAppliedOptions);
      
      const newRestrictions = getRestrictions(formProperty.root, newAppliedOptions);
      updateSelectedOptions(newRestrictions);
      setRestrictions(newRestrictions);
    });

    const valueSubscription = formProperty.valueChanges.subscribe((restrictionsArray: Restriction[]) => {
      updateSelectedOptions(restrictionsArray);
      const extensionProperty = formProperty.root.getProperty('extension');
      updateRelevantExtensions(extensionProperty.value, restrictionsArray);
      extensionProperty.setValue(extensionProperty.value, true);
    });

    return () => {
      typeSubscription.unsubscribe();
      valueSubscription.unsubscribe();
    };
  }, [formProperty, getRestrictions, updateSelectedOptions, updateRelevantExtensions, typeToOptions]);

  return (
    <Table
      value={restrictions}
      onChange={(newRestrictions: Restriction[]) => {
        setRestrictions(newRestrictions);
        formProperty.setValue(newRestrictions, true);
      }}
      options={appliedOptions}
      selectedOptions={selectedOptions}
    />
  );
};
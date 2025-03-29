import React, { useEffect } from 'react';
import { FormElement } from '../form-element/FormElement';
import { ITEM_CONTROL_EXT_URL } from '../../../utils/constants';
import { FormProperty } from '../../../types/FormProperty';

interface HelpTextProps {
  formProperty: FormProperty;
}

export const HelpText: React.FC<HelpTextProps> = ({ formProperty }) => {
  useEffect(() => {
    const value = formProperty.value;
    value.linkId = value.linkId?.trim() || `${formProperty.parent?.value.linkId}_helpText`;
    value.type = 'display';
    value.extension = value.extension || [];
    
    const hasHelpControl = value.extension.some((ext) => 
      ext.url === ITEM_CONTROL_EXT_URL && 
      ext.valueCodeableConcept.coding.some((coding) => coding.code === 'help')
    );

    if (!hasHelpControl) {
      value.extension.push({
        url: ITEM_CONTROL_EXT_URL,
        valueCodeableConcept: {
          text: 'Help-Button',
          coding: [
            {
              code: 'help',
              display: 'Help-Button',
              system: 'http://hl7.org/fhir/questionnaire-item-control'
            }
          ]
        }
      });
    }

    formProperty.setValue(value, false);
  }, [formProperty]);

  return (
    <FormElement formProperty={formProperty.searchProperty('/__$helpText/text')} />
  );
};
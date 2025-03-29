import React, { useEffect, useState, useCallback } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Radio, Checkbox } from '@mui/material';
import { useFormContext } from '../../../contexts/FormContext';
import { useTreeService } from '../../../services/TreeService';
import { useFormService } from '../../../services/FormService';

const ORDINAL_URI = 'http://hl7.org/fhir/StructureDefinition/ordinalValue';
const ITEM_WEIGHT_URI = 'http://hl7.org/fhir/StructureDefinition/itemWeight';

interface AnswerOptionProps {
  formProperty: any;
}

export const AnswerOption: React.FC<AnswerOptionProps> = ({ formProperty }) => {
  const [selectionRadio, setSelectionRadio] = useState<number>(-1);
  const [selectionCheckbox, setSelectionCheckbox] = useState<boolean[]>([]);
  const [rowSelectionType, setRowSelectionType] = useState<'radio' | 'checkbox'>('radio');
  const [initializing, setInitializing] = useState(true);

  const treeService = useTreeService();
  const formService = useFormService();

  const updateDefaultSelections = useCallback((answerOptionArray: any[]) => {
    if (rowSelectionType === 'radio') {
      let newSelectionRadio = -1;
      answerOptionArray.some((prop, index) => {
        if (prop.initialSelected) {
          newSelectionRadio = index;
          return true;
        }
        return false;
      });
      setSelectionRadio(newSelectionRadio);
    } else if (rowSelectionType === 'checkbox') {
      const newSelectionCheckbox = answerOptionArray.map(prop => !!prop.initialSelected);
      setSelectionCheckbox(newSelectionCheckbox);
    }
  }, [rowSelectionType]);

  const setAnswerOptions = useCallback((answerOptions: any[]) => {
    let changed = false;
    answerOptions?.forEach((option) => {
      if (option.valueCoding) {
        const scoreExt = option.extension?.find((ext: any) => {
          return ext.url === ORDINAL_URI || ext.url === ITEM_WEIGHT_URI;
        });
        const score = option.valueCoding.__$score !== undefined ? option.valueCoding.__$score : null;
        const newVal = scoreExt && scoreExt.valueDecimal !== undefined ? scoreExt.valueDecimal : null;
        if (score !== newVal) {
          option.valueCoding.__$score = newVal;
          changed = true;
        }
      }
    });
    if (changed) {
      formProperty.setValue(answerOptions, false);
    }
    return changed;
  }, [formProperty]);

  const updateScoreExtensions = useCallback((options: any[]) => {
    let changed = false;
    options?.forEach((option) => {
      const i = option.extension?.findIndex((ext: any) => {
        return ext.url === ORDINAL_URI || ext.url === ITEM_WEIGHT_URI;
      });
      const valueDecimal = i >= 0 ? option.extension[i].valueDecimal : null;
      const score = option.valueCoding?.__$score !== undefined ? option.valueCoding?.__$score : null;
      let updated = false;
      if (valueDecimal !== score) {
        const isAdd = score !== null;
        if (isAdd && i < 0) {
          const scoreExt = { url: ITEM_WEIGHT_URI, valueDecimal: score };
          option.extension = option.extension || [];
          option.extension.push(scoreExt);
          updated = true;
        } else if (isAdd && i >= 0) {
          option.extension[i].valueDecimal = score;
          updated = true;
        } else if (i >= 0) {
          option.extension.splice(i, 1);
          updated = true;
        }
      }
      if (updated) {
        changed = true;
      }
    });
    return changed;
  }, []);

  const updateWithRadioSelection = useCallback(() => {
    const currentValue = formProperty.value;
    let updated = false;
    currentValue?.forEach((option: any, index: number) => {
      if (index === selectionRadio) {
        if (!option.initialSelected) {
          option.initialSelected = true;
          updated = true;
        }
      } else if (option.initialSelected) {
        delete option.initialSelected;
        updated = true;
      }
    });

    if (updated) {
      formProperty.updateValueAndValidity();
    }
  }, [formProperty, selectionRadio]);

  const updateWithCheckboxSelections = useCallback(() => {
    const currentValue = formProperty.value;
    let updated = false;
    currentValue?.forEach((option: any, index: number) => {
      if (selectionCheckbox[index]) {
        if (!option.initialSelected) {
          option.initialSelected = true;
          updated = true;
        }
      } else if (option.initialSelected) {
        delete option.initialSelected;
        updated = true;
      }
    });

    if (updated) {
      formProperty.updateValueAndValidity();
    }
  }, [formProperty, selectionCheckbox]);

  const handleRadioChange = (index: number) => {
    setSelectionRadio(index);
    updateWithRadioSelection();
  };

  const handleCheckboxChange = (index: number) => {
    const newSelectionCheckbox = [...selectionCheckbox];
    newSelectionCheckbox[index] = !newSelectionCheckbox[index];
    setSelectionCheckbox(newSelectionCheckbox);
    updateWithCheckboxSelections();
  };

  const clearSelections = useCallback(() => {
    setSelectionRadio(-1);
    setSelectionCheckbox([]);
    updateWithRadioSelection();
    updateWithCheckboxSelections();
  }, [updateWithRadioSelection, updateWithCheckboxSelections]);

  useEffect(() => {
    const init = () => {
      setInitializing(true);
      const repeatProp = formProperty.findRoot().getProperty('repeats');
      setRowSelectionType(repeatProp.value ? 'checkbox' : 'radio');
      const aOptions = formProperty.value;
      updateDefaultSelections(aOptions || []);
      setAnswerOptions(aOptions);
      setInitializing(false);
    };

    init();

    const subscriptions = [
      formProperty.valueChanges.subscribe((newValue: any) => {
        if (!initializing) {
          updateScoreExtensions(newValue);
        }
      }),

      formService.formReset$.subscribe(() => {
        setInitializing(true);
        init();
        setInitializing(false);
      }),

      formProperty.findRoot().getProperty('repeats').valueChanges.subscribe((isRepeating: boolean) => {
        setRowSelectionType(isRepeating ? 'checkbox' : 'radio');
        if (!initializing) {
          const firstCheckbox = selectionCheckbox.findIndex(e => e);
          if (isRepeating) {
            if (firstCheckbox < 0 && selectionRadio >= 0) {
              const newSelectionCheckbox = [...selectionCheckbox];
              newSelectionCheckbox[selectionRadio] = true;
              setSelectionCheckbox(newSelectionCheckbox);
            }
            updateWithCheckboxSelections();
          } else {
            if (selectionRadio < 0 && firstCheckbox >= 0) {
              setSelectionRadio(firstCheckbox);
            }
            updateWithRadioSelection();
          }
        }
      }),

      formService.formChanged$.subscribe(() => {
        setInitializing(true);
      })
    ];

    return () => {
      subscriptions.forEach(sub => sub.unsubscribe());
    };
  }, [
    formProperty,
    formService,
    initializing,
    selectionCheckbox,
    selectionRadio,
    updateDefaultSelections,
    updateScoreExtensions,
    updateWithCheckboxSelections,
    updateWithRadioSelection,
    setAnswerOptions
  ]);

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Selection</TableCell>
            <TableCell>Code</TableCell>
            <TableCell>Display</TableCell>
            <TableCell>Score</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {formProperty.value?.map((option: any, index: number) => (
            <TableRow key={index}>
              <TableCell>
                {rowSelectionType === 'radio' ? (
                  <Radio
                    checked={selectionRadio === index}
                    onChange={() => handleRadioChange(index)}
                  />
                ) : (
                  <Checkbox
                    checked={selectionCheckbox[index] || false}
                    onChange={() => handleCheckboxChange(index)}
                  />
                )}
              </TableCell>
              <TableCell>{option.valueCoding?.code}</TableCell>
              <TableCell>{option.valueCoding?.display}</TableCell>
              <TableCell>{option.valueCoding?.__$score}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default AnswerOption;
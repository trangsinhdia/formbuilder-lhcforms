import React, { useEffect, useRef, useState } from 'react';
import { TextField, Autocomplete } from '@mui/material';
import { Coding } from 'fhir/r4';
import { LhcAutoCompleteOptions, FhirOptions } from '../../../types/AutoComplete';

declare const LForms: any;

let serialNumber = 0;

interface AutoCompleteProps {
  model?: Coding;
  options: {
    acOptions: LhcAutoCompleteOptions;
    fhirOptions?: FhirOptions;
  };
  onRemoved?: (coding: Coding | null) => void;
  onSelected?: (coding: Coding | null) => void;
}

export const AutoComplete: React.FC<AutoCompleteProps> = ({
  model,
  options,
  onRemoved,
  onSelected
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [elId] = useState(() => `lfb-auto-complete-${serialNumber++}`);
  const autoCompRef = useRef<any>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const convertLHCCoding = (lhcCoding: any): Coding | null => {
    if (!lhcCoding) {
      return null;
    }
    const coding: Coding = {};
    if (lhcCoding.code) {
      coding.code = lhcCoding.code;
    }
    if (lhcCoding.text) {
      coding.display = lhcCoding.text;
    }
    if (lhcCoding.code_system) {
      coding.system = lhcCoding.code_system;
    }
    return coding;
  };

  const createValueSetUrl = (fhirOptions: FhirOptions): string | null => {
    let ret = null;
    if (fhirOptions.fhirServer) {
      const baseUrl = fhirOptions.fhirServer.endsWith('/') ? fhirOptions.fhirServer : fhirOptions.fhirServer + '/';
      const url = new URL('ValueSet/' + fhirOptions.operation, baseUrl);
      if (fhirOptions.valueSetUri) {
        url.searchParams.set('url', decodeURIComponent(fhirOptions.valueSetUri));
      }
      ret = url.toString();
    }
    return ret;
  };

  const destroyAutocomplete = () => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    if (autoCompRef.current) {
      autoCompRef.current.setFieldVal('', false);
      autoCompRef.current.destroy();
      autoCompRef.current = null;
    }
  };

  const resetAutocomplete = () => {
    destroyAutocomplete();

    if (options?.fhirOptions) {
      options.acOptions.fhir = true;
      options.acOptions.url = createValueSetUrl(options.fhirOptions);
    }

    if (inputRef.current) {
      autoCompRef.current = new LForms.Def.Autocompleter.Search(
        inputRef.current.id,
        options.acOptions.url,
        options.acOptions
      );

      if (model && (model.display || model.code)) {
        autoCompRef.current.setFieldVal(model.display, false);
        autoCompRef.current.storeSelectedItem(model.display, model.code);
      }

      unsubscribeRef.current = LForms.Def.Autocompleter.Event.observeListSelections(
        inputRef.current.id,
        (data: any) => {
          let coding = null;
          if (data.removed) {
            onRemoved?.(autoCompRef.current.getItemData(data.final_val));
          }
          else if (options.acOptions.maxSelect === 1 && !(data.final_val?.trim())) {
            onRemoved?.(null);
          }
          else if (data.used_list) {
            coding = autoCompRef.current.getItemData(data.final_val);
            onSelected?.(convertLHCCoding(coding));
          }
          else {
            const prevDisplay = model?.display;
            if (prevDisplay && prevDisplay !== data.final_val.trim()) {
              const display = data.final_val?.trim();
              coding = null;
              if (display) {
                coding = { code: display.replace(/\s+/g, '_'), display };
              }
              onSelected?.(coding);
            }
          }
        }
      );
    }
  };

  useEffect(() => {
    resetAutocomplete();
    return destroyAutocomplete;
  }, [options]); // Reset when options change

  useEffect(() => {
    return () => {
      destroyAutocomplete();
    };
  }, []); // Cleanup on unmount

  return (
    <input
      ref={inputRef}
      id={elId}
      type="text"
      autoComplete="off"
      className="form-control"
    />
  );
};

export default AutoComplete;
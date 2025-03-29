import React, { useEffect, useState, useCallback } from 'react';
import { TextField, Select, MenuItem, FormControl, InputLabel, Grid, Typography, Tooltip, IconButton, InputAdornment } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { useFetchService } from '../../../services/FetchService';
import { useFormService } from '../../../services/FormService';
import { useExtensionsService } from '../../../services/ExtensionsService';
import { Label } from '../Label';
import { removeAnchorTagFromString } from '../../../utils/Util';
import './AnswerValueSet.css';

const SNOMED_BASE_URI = 'http://snomed.info/sct';
const SNOMED_TERMINOLOGY_SERVER = 'https://snowstorm.ihtsdotools.org/fhir';
const SNOMED_TS_HINT = 'Note that this option also sets the terminology server option below (under "Advanced fields").';
const NON_SNOMED_TS_HINT = 'Make sure that you provide a valid URL for a supporting terminology server below (under Advanced fields).';
const PREFERRED_TERMINOLOGY_SERVER_URI = 'http://hl7.org/fhir/StructureDefinition/questionnaire-preferredTerminologyServer';

interface AnswerValueSetProps {
  formProperty: any;
  schema: any;
  id: string;
  name: string;
  labelPosition?: 'left' | 'top';
  nolabel?: boolean;
}

export const AnswerValueSet: React.FC<AnswerValueSetProps> = ({
  formProperty,
  schema,
  id,
  name,
  labelPosition = 'top',
  nolabel = false
}) => {
  const [valueSetType, setValueSetType] = useState<'value-set' | 'snomed-value-set'>('value-set');
  const [snomedEdition, setSnomedEdition] = useState('900000000000207008'); // Default international edition
  const [snomedVersion, setSnomedVersion] = useState('');
  const [snomedUrl, setSnomedUrl] = useState('');
  const [nonSnomedUrl, setNonSnomedUrl] = useState('');
  const [snomedFhirVS, setSnomedFhirVS] = useState('');
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const [tsHint, setTsHint] = useState(NON_SNOMED_TS_HINT);

  const fetchService = useFetchService();
  const formService = useFormService();
  const extensionsService = useExtensionsService();

  const eclHelpContent = `See the <a class="lfb-tooltip-link" target="_blank" href="https://confluence.ihtsdotools.org/display/DOCECL">
    ECL documentation</a> for more information, or try the ECL Builder in the 
    <a class="lfb-tooltip-link" target="_blank" href="https://browser.ihtsdotools.org/?perspective=full&languages=en">
    SNOMED CT Browser</a>. In the browser, under the 'Expression Constraint Queries' tab, click the 'ECL Builder' button.`;

  const eclPrefixRE = /^ecl\s*\//i;
  const parseEditionRE = /sct\/([^\/]+)?(\/version\/([^\/]+))?/;

  const updateUrl = useCallback(() => {
    let url = new URL(SNOMED_BASE_URI);
    url.pathname = '/sct/';
    url.pathname += snomedEdition || '';
    url.pathname += snomedVersion ? '/version/' + snomedVersion : '';

    let newSnomedUrl = '';
    if (snomedFhirVS && snomedEdition) {
      const ecl = eclPrefixRE.test(snomedFhirVS) ? snomedFhirVS : 'ecl/' + snomedFhirVS;
      url.searchParams.set('fhir_vs', ecl);
      newSnomedUrl = url.toString();
    }
    setSnomedUrl(newSnomedUrl);
    formProperty.setValue(newSnomedUrl, false);
  }, [snomedEdition, snomedVersion, snomedFhirVS, formProperty]);

  const setSNOMEDTerminologyServer = useCallback((isAdd: boolean) => {
    if (isAdd) {
      if (!extensionsService.getFirstExtensionByUrl(PREFERRED_TERMINOLOGY_SERVER_URI)) {
        extensionsService.addExtension({
          url: PREFERRED_TERMINOLOGY_SERVER_URI,
          valueUrl: SNOMED_TERMINOLOGY_SERVER
        }, 'valueUrl');
      }
    } else {
      extensionsService.removeExtension((ext: any) => {
        return ext.value.url === PREFERRED_TERMINOLOGY_SERVER_URI &&
               ext.value.valueUrl === SNOMED_TERMINOLOGY_SERVER;
      });
    }
  }, [extensionsService]);

  const updateSnomedFields = useCallback((answerValueSetURI: string) => {
    if (answerValueSetURI && answerValueSetURI.startsWith(SNOMED_BASE_URI)) {
      const uri = new URL(answerValueSetURI);
      let ecl = uri.searchParams.get('fhir_vs') || '';
      ecl = ecl.replace(eclPrefixRE, '');
      setSnomedFhirVS(ecl);
      const matches = uri.pathname.match(parseEditionRE);
      if (matches) {
        setSnomedEdition(matches[1] || '');
        setSnomedVersion(matches[3] || '');
      }
    } else {
      setSnomedFhirVS('');
      setSnomedEdition('');
      setSnomedVersion('');
    }
  }, []);

  const updateUI = useCallback((answerValueSetValue: string) => {
    if (valueSetType === 'snomed-value-set') {
      if (answerValueSetValue) {
        updateSnomedFields(answerValueSetValue);
        setSnomedUrl(answerValueSetValue);
      } else {
        setSnomedUrl('');
      }
    } else if (valueSetType === 'value-set') {
      if (answerValueSetValue) {
        setNonSnomedUrl(answerValueSetValue);
      }
    }
  }, [valueSetType, updateSnomedFields]);

  const handleEclChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSnomedFhirVS(event.target.value);
    setSNOMEDTerminologyServer(!!event.target.value);
    updateUrl();
  };

  const handleEditionChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const newEdition = event.target.value as string;
    setSnomedEdition(newEdition);
    setSnomedVersion(''); // Reset version when edition is changed
    updateUrl();
  };

  const handleVersionChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setSnomedVersion(event.target.value as string);
    updateUrl();
  };

  useEffect(() => {
    const asMethod = formProperty.searchProperty('__$answerOptionMethods').value;
    setValueSetType(asMethod || 'value-set');
    updateUI(formProperty.value);

    const subscriptions = [
      formService.formReset$.subscribe(() => {
        const asmValue = formProperty.searchProperty('__$answerOptionMethods').value;
        setValueSetType(asmValue || 'value-set');
        updateUI(formProperty.value);
      }),

      formProperty.searchProperty('__$answerOptionMethods').valueChanges.subscribe((newVal: string) => {
        setValueSetType(newVal as 'value-set' | 'snomed-value-set');
        setTsHint(newVal === 'snomed-value-set' ? SNOMED_TS_HINT : NON_SNOMED_TS_HINT);
        updateUI(formProperty.value);
      })
    ];

    return () => {
      subscriptions.forEach(sub => sub.unsubscribe());
    };
  }, [formProperty, formService, updateUI]);

  return (
    <div className={`answer-value-set ${labelPosition === 'left' ? 'row' : ''}`}>
      {!nolabel && (
        <Label
          htmlFor={id}
          title={schema.title}
          helpMessage={schema.description}
          className={labelPosition === 'left' ? 'col-form-label' : ''}
        />
      )}
      <div className="col">
        <Typography variant="caption" component="p" className="mb-1">
          <em>{tsHint}</em>
        </Typography>

        {valueSetType === 'snomed-value-set' ? (
          <div className="snomed-section">
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={3}>
                <Typography variant="body2">
                  Enter SNOMED ECL
                  <Tooltip
                    title={<div dangerouslySetInnerHTML={{ __html: eclHelpContent }} />}
                    open={tooltipOpen}
                    onClose={() => setTooltipOpen(false)}
                    onOpen={() => setTooltipOpen(true)}
                  >
                    <IconButton size="small">
                      <FontAwesomeIcon icon={faInfoCircle} />
                    </IconButton>
                  </Tooltip>:
                </Typography>
              </Grid>
              <Grid item xs={9}>
                <TextField
                  fullWidth
                  size="small"
                  value={snomedFhirVS}
                  onChange={handleEclChange}
                  placeholder="Enter SNOMED ECL"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">ecl/</InputAdornment>,
                  }}
                />
              </Grid>
            </Grid>

            <Grid container spacing={2} alignItems="center" className="mt-2">
              <Grid item xs={3}>
                <Typography variant="body2">Select SNOMED edition:</Typography>
              </Grid>
              <Grid item xs={9}>
                <FormControl fullWidth size="small">
                  <Select
                    value={snomedEdition}
                    onChange={handleEditionChange}
                  >
                    {Array.from(fetchService.snomedEditions.entries()).map(([eid, edition]) => (
                      <MenuItem key={eid} value={eid}>
                        {`${edition.title} (${eid})`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {snomedEdition && (
              <Grid container spacing={2} alignItems="center" className="mt-2">
                <Grid item xs={3}>
                  <Typography variant="body2">Select SNOMED version:</Typography>
                </Grid>
                <Grid item xs={9}>
                  <FormControl fullWidth size="small">
                    <Select
                      value={snomedVersion}
                      onChange={handleVersionChange}
                    >
                      <MenuItem value="">Default</MenuItem>
                      {fetchService.snomedEditions.get(snomedEdition)?.versions.map(ver => (
                        <MenuItem key={ver} value={ver}>{ver}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            )}

            {formProperty.value && (
              <div className="mt-3">
                <Typography variant="caption" className="text-muted fst-italic text-decoration-underline">
                  Formatted answerValueSet URI:
                </Typography>
                <Typography variant="body2" className="text-muted text-break">
                  {formProperty.value}
                </Typography>
              </div>
            )}
          </div>
        ) : (
          <TextField
            fullWidth
            size="small"
            type="url"
            name={name}
            id={`${id}_non-snomed`}
            value={nonSnomedUrl}
            onChange={(e) => {
              setNonSnomedUrl(e.target.value);
              formProperty.setValue(e.target.value, false);
            }}
            placeholder={schema.placeholder}
            disabled={valueSetType === 'snomed-value-set' || schema.disabled}
            InputProps={{
              readOnly: schema.readOnly,
            }}
          />
        )}
      </div>
    </div>
  );
};

export default AnswerValueSet;
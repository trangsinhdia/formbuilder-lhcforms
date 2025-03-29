import { Questionnaire } from 'fhir/r4';

export type GuidingStep = 'home' | 'fl-editor' | 'item-editor';
export type StartOption = 'from_autosave' | 'scratch' | 'existing';
export type ImportOption = 'local' | 'fhirServer' | 'loinc' | '';
export type ExportType = 'CREATE' | 'UPDATE';

export interface BasePageProps {
  guidingStep?: GuidingStep;
  onStateChange?: (state: string) => void;
}

export interface FormChangeEvent {
  questionnaire: Questionnaire;
}
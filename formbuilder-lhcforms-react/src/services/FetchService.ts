/**
 * A service to fetch data from clinical tables search service and lforms-fhir servers.
 */
import axios, { AxiosError, AxiosResponse } from 'axios';
import { AutoCompleteResult } from '../types/AutoComplete';
import { Util } from '../utils/Util';
import { Questionnaire, Bundle, CodeSystem } from 'fhir/r4';
import SNOMED_CT_Editions from '../assets/SNOMED_CT_Editions.json';

declare const LForms: any;

export enum JsonFormatType {
  R5 = 'R5',
  R4 = 'R4',
  STU3 = 'STU3',
  LFORMS = 'lforms'
}

/**
 * A map with edition id as key and SNOMEDEdition as value.
 */
export interface SNOMEDEdition {
  title?: string;
  versions?: string[];
}

export type SNOMEDEditions = Map<string, SNOMEDEdition>;

export enum LoincItemType {
  PANEL = 'panel',
  QUESTION = 'question'
}

class FetchService {
  private static readonly loincBaseUrl = 'https://clinicaltables.nlm.nih.gov';
  private static readonly loincSearchUrl = FetchService.loincBaseUrl + '/api/loinc_items/v3/search';
  private static readonly loincFormsUrl = FetchService.loincBaseUrl + '/loinc_form_definitions';
  private static readonly fhirUrl = 'https://lforms-fhir.nlm.nih.gov/baseR4/Questionnaire';
  private static readonly snomedCodeSystemsUrl = 'https://snowstorm.ihtsdotools.org/fhir/CodeSystem';
  
  private _snomedEditions: SNOMEDEditions | null = null;
  public readonly assetsUrl = '/assets';

  /**
   * Getter for _snomedEditions
   */
  get snomedEditions(): SNOMEDEditions | null {
    return this._snomedEditions;
  }

  /**
   * Get questionnaire by id from FHIR server.
   * @param id - Id of the questionnaire
   */
  async getFhirFormData(id: string): Promise<Questionnaire> {
    const response = await axios.get<Questionnaire>(`${FetchService.fhirUrl}/${id}`);
    return response.data;
  }

  /**
   * Get questionnaire by id from LOINC.
   *
   * @param loincNum - LOINC number of the form.
   */
  async getLoincFormData(loincNum: string): Promise<Questionnaire> {
    try {
      const response = await axios.get<Questionnaire>(FetchService.loincFormsUrl, {
        params: { loinc_num: loincNum }
      });
      return LForms.Util.getFormFHIRData('Questionnaire', 'R5', response.data);
    } catch (error) {
      console.log(`Loading loinc form ${loincNum}`, error);
      return [];
    }
  }

  /**
   * Search LOINC questionnaires on ctss, intended for auto completion for importing questionnaires.
   *
   * @param term - Search term
   */
  async searchLoincForms(term: string): Promise<AutoCompleteResult[]> {
    try {
      const response = await axios.get(FetchService.loincSearchUrl, {
        params: {
          terms: term,
          df: 'LOINC_NUM,text',
          type: 'form_and_section',
          available: 'true'
        }
      });
      
      return (response.data[3] as Array<any>).map((e) => ({
        id: e[0],
        title: e[1]
      }));
    } catch (error) {
      console.log('searching for ' + term, error);
      return [];
    }
  }

  /**
   * Search CTSS for loinc items, intended for auto complete.
   *
   * @param term - Search term.
   * @param loincType - Panel or question.
   */
  async searchLoincItems(term: string, loincType?: LoincItemType): Promise<AutoCompleteResult[]> {
    try {
      const params: Record<string, any> = {
        terms: term,
        maxList: 20
      };

      if (loincType === LoincItemType.PANEL) {
        params.type = 'form_and_section';
        params.available = true;
      } else {
        params.type = 'question';
        params.ef = 'answers,units,datatype';
      }

      const response = await axios.get(FetchService.loincSearchUrl, { params });
      const results: AutoCompleteResult[] = [];

      if (Array.isArray(response.data)) {
        const [, loincNums, extraFields, texts] = response.data;
        loincNums.forEach((loincNum: string, index: number) => {
          const item = this.convertLoincQToItem(
            loincNum,
            texts[index][0],
            extraFields ? extraFields.answers[index] : null,
            extraFields ? extraFields.units[index] : null,
            extraFields ? extraFields.datatype[index] : null
          );
          results.push(item);
        });
      }
      return results;
    } catch (error) {
      console.error('Error searching LOINC items:', error);
      return [];
    }
  }

  /**
   * Fetch loinc panel based on loinc number.
   * @param loincNum - Loinc number
   */
  async getLoincPanel(loincNum: string): Promise<any> {
    try {
      const response = await axios.get(FetchService.loincFormsUrl, {
        params: { loinc_num: loincNum }
      });

      const form = response.data;
      // Convert form level fields to item level fields
      const convertedLFormsItem = {
        question: form.name,
        questionCode: form.code,
        dataType: 'SECTION',
        items: form.items
      };

      // Wrap it in LForms for conversion
      const wrapperLForm = {
        lformsVersion: form.lformsVersion,
        name: form.name,
        items: [convertedLFormsItem]
      };

      const fhirQ = LForms.Util.getFormFHIRData('Questionnaire', 'R5', wrapperLForm);
      return fhirQ.item[0]; // It is just one item in item array
    } catch (error) {
      console.error('Error fetching LOINC panel:', error);
      throw error;
    }
  }

  /**
   * Create FHIR Questionnaire.item from loinc question info.
   */
  private convertLoincQToItem(
    loincNum: string,
    text: string,
    answers: any[],
    units: any[],
    datatype: string
  ): any {
    const ret: any = {
      code: [{
        code: loincNum,
        system: 'http://loinc.org',
        display: text
      }],
      text: text
    };

    if (answers) {
      ret.answerOption = answers.map(answer => ({
        valueCoding: {
          code: answer.AnswerStringID,
          system: 'http://loinc.org',
          display: answer.DisplayText
        }
      }));
    }

    ret.type = Util.getFhirType(datatype);
    if (units) {
      ret.extension = Util.convertUnitsToExtensions(units, ret.type);
    }

    return ret;
  }

  /**
   * Fetch and store SNOMED editions and versions data from SNOMED site.
   */
  async fetchSnomedEditions(): Promise<void> {
    if (this._snomedEditions) {
      return;
    }

    try {
      const response = await axios.get<Bundle>(FetchService.snomedCodeSystemsUrl);
      console.log('Fetched SNOMED editions.');
      this._snomedEditions = this.parseSNOMEDEditions(response.data);
    } catch (error) {
      console.log('Using packaged SNOMED editions.');
      this._snomedEditions = this.parseSNOMEDEditions(SNOMED_CT_Editions as Bundle);
    }
  }

  /**
   * Parse a SNOMED CodeSystem bundle.
   * @param snomedCSBundle - Response from SNOMED CodeSystem API.
   */
  private parseSNOMEDEditions(snomedCSBundle: Bundle): SNOMEDEditions {
    const editionVersionRE = /^http:\/\/snomed.info\/sct\/([^\/]+)\/version\/(.+)?$/;
    const results = new Map<string, SNOMEDEdition>();

    snomedCSBundle.entry?.forEach((res: any) => {
      const versionUri = res.resource.version;
      const matches = versionUri.match(editionVersionRE);
      
      if (matches) {
        const id = matches[1];
        const version = matches[2];
        const existingEdition = results.get(id);

        if (existingEdition) {
          existingEdition.versions?.push(version);
        } else {
          results.set(id, {
            title: res.resource.title,
            versions: [version]
          });
        }
      }
    });

    return results;
  }
}

// Create a singleton instance
const fetchService = new FetchService();
export default fetchService;
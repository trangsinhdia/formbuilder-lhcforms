/**
 * A utility class for the form builder
 */
import { Extension, Questionnaire } from 'fhir/r4';

export class Util {
  private static readonly ITEM_CONTROL_EXT_URL = 'http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl';
  private static readonly RENDERING_STYLE_EXT_URL = 'http://hl7.org/fhir/StructureDefinition/rendering-style';
  private static readonly RENDERING_XHTML_EXT_URL = 'http://hl7.org/fhir/StructureDefinition/rendering-xhtml';

  /**
   * Convert lforms data type to FHIR data type
   * @param lformsType - Lforms data type.
   */
  static getFhirType(lformsType: string): string {
    let ret = 'string';
    switch (lformsType) {
      case 'INT':
        ret = 'integer';
        break;
      case 'REAL':
        ret = 'decimal';
        break;
      case 'DT':
      case 'DAY':
      case 'MONTH':
      case 'YEAR':
        ret = 'date';
        break;
      case 'DTM':
        ret = 'dateTime';
        break;
      case 'ST':
      case 'EMAIL':
      case 'PHONE':
        ret = 'string';
        break;
      case 'TITLE':
        ret = 'display';
        break;
      case 'TM':
        ret = 'time';
        break;
      case 'SECTION':
      case null: // Null type for panels.
        ret = 'group';
        break;
      case 'URL':
        ret = 'url';
        break;
      case 'QTY':
        ret = 'quantity';
        break;
      case 'CNE':
      case 'CWE':
        ret = 'coding';
        break;
    }
    return ret;
  }

  /**
   * Convert lforms units to equivalent FHIR extensions. For quantity type, all
   * units are converted, and for decimal or integer, only the first unit is converted.
   *
   * @param units - units in lforms format.
   * @param dataType - 'quantity' || 'decimal' || 'integer'
   */
  static convertUnitsToExtensions(units: any[], dataType: string): Extension[] | null {
    if (!units) {
      return null;
    }

    const ret: Extension[] = [];
    const unitUri = dataType === 'quantity'
      ? 'http://hl7.org/fhir/StructureDefinition/questionnaire-unitOption'
      : 'http://hl7.org/fhir/StructureDefinition/questionnaire-unit';

    units.some((unit) => {
      // Note: We'll need to implement or import UcumLhcUtils functionality
      // const display = LForms.ucumPkg.UcumLhcUtils.getInstance().validateUnitString(unit.unit)?.unit?.name || unit.unit;
      const display = unit.unit; // Simplified for now

      ret.push({
        url: unitUri,
        valueCoding: {
          code: unit.unit,
          system: 'http://unitsofmeasure.org',
          display: display
        }
      });

      // For quantity convert all units. For decimal or integer pick the first one.
      return (dataType !== 'quantity');
    });

    return ret;
  }

  /**
   * Identify if an input is empty, typically intended to detect user input.
   * The definition of empty:
   * Anything null, undefined or empty string is empty.
   * Any object or an array containing all empty elements is empty.
   *
   * @param json - Input to test the emptiness.
   * @return boolean - True if empty.
   */
  static isEmpty(json: unknown): boolean {
    if (typeof json === 'number' || typeof json === 'boolean') {
      return false;
    }
    if (!json) {
      return true; // empty string, null and undefined are empty
    }
    if (json instanceof Date) {
      return false;
    }
    if (Array.isArray(json)) {
      return json.every(item => Util.isEmpty(item));
    }
    if (typeof json === 'object') {
      if (Object.keys(json).length === 0) {
        return true;
      }
      return Object.values(json).every(value => Util.isEmpty(value));
    }
    return false;
  }

  /**
   * Create bare minimum form.
   */
  static createDefaultForm(): Questionnaire {
    return {
      resourceType: 'Questionnaire',
      title: 'New Form',
      status: 'draft',
      meta: {
        profile: ['http://hl7.org/fhir/5.0/StructureDefinition/Questionnaire']
      },
      item: []
    };
  }
}
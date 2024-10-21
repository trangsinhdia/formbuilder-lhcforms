import {ChangeDetectorRef, Component, DoCheck, ElementRef, EventEmitter, OnInit, Output, Renderer2, ViewEncapsulation} from '@angular/core';
import {TableComponent} from '../table/table.component';
import {Util} from '../../util';
import {ObjectProperty, PropertyGroup} from '@lhncbc/ngx-schema-form/lib/model';
import {faExclamationTriangle} from '@fortawesome/free-solid-svg-icons';
import {FormProperty} from '@lhncbc/ngx-schema-form';
import {Observable, of } from 'rxjs';
import { FormService } from 'src/app/services/form.service';

@Component({
  selector: 'lfb-enable-when',
  templateUrl: './enable-when.component.html',
  styleUrls: ['./enable-when.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class EnableWhenComponent extends TableComponent implements OnInit, DoCheck {

  showFieldNames: string[] = ['question', 'operator', 'answerString'];
  showHeaderFields: any[];
  warningIcon = faExclamationTriangle;

  constructor(private renderer: Renderer2, private elementRef: ElementRef,
              private cdr: ChangeDetectorRef, private formService: FormService) {
    super(elementRef, cdr);
  }

  ngOnInit() {
    super.ngOnInit();
    const definedShowFields = this.formProperty.schema.widget.showFields;
    this.showHeaderFields = this.showFieldNames.map((fName) => {

      const schemaDef = definedShowFields.find((f) => {
        return f.field === fName;
      })
      if(schemaDef) {
        schemaDef.description = this.formProperty.schema.items.properties[fName].description;
      }
      return schemaDef;
    });

  }

  ngDoCheck() {
    if(this.formProperty.properties.length === 0) {
      this.addItem();
    }
  }


  get rowProperties(): ObjectProperty [] {
    return this.formProperty.properties as ObjectProperty[];
  }


  /**
   * Whether to display the field in the cell
   * @param singleEnableWhenProperty - FormProperty representing an enableWhen condition.
   * @param fieldName - One of the field name from enableWhen object.
   *
   * @return boolean
   */
  isShow(singleEnableWhenProperty: PropertyGroup, fieldName: string): boolean {
    let show = false;
    if(fieldName === 'question') {
      show = true;
    }
    else if(fieldName === 'operator') {
      const q = singleEnableWhenProperty.getProperty('question').value;
      show = !!q;
    }
    else if(Util.isAnswerField(fieldName)) {
      const op = singleEnableWhenProperty.getProperty('operator').value;
      show = !!op && op !== 'exists';
    }
    return show;
  }


  /**
   * Check validity of enableWhen fields. question, operator and answer[x] are mandatory.
   * Question implies presence of enableWhen. Highlight other missing fields.
   * @param rowProperty - FormProperty representing a single condition (row).
   * @param field - Property id of the field.
   */
  isValid(rowProperty: ObjectProperty, field: string): boolean {
    const prop = rowProperty.getProperty(field);
    const errorType = ["ENABLEWHEN", "INVALID_QUESTION"];
    const ret = prop._errors?.some((err) => {
      return errorType.some(errType => err.code?.startsWith(errType));
    });
    return !ret;
  }

  /**
   * Loop through each of the 'EnableWhen' fields and return any errors.
   * @param rowProperty - Object property representing an enableWhen condition.
   * @returns - observable that emits a string created by joining the 'errorMessage' array.
   */
  getEnableWhenFieldErrors(rowProperty: ObjectProperty): Observable<string> {
    let errorMessages: string [] = [];
    const fields = ["question", "operator", "__$answerType"];

    for (const field of fields) {
      const fieldValue = rowProperty.getProperty(field)?.value;
      if (fieldValue) {
        const fieldName = (field === '__$answerType') ? Util.getAnswerFieldName(fieldValue) : field;
        const errors = this.getFieldErrors(rowProperty.getProperty(fieldName));
        
        if (errors) {
          errorMessages.push(...errors);
          break;
        }
      }
    }

    return of(errorMessages.length ? errorMessages.join() : null);
  }

  /**
   * Collect enablewhen related errors from the field.
   * @param fieldProperty - FormProperty representing the field.
   */
  getFieldErrors(fieldProperty: FormProperty): string [] {
    const messages = fieldProperty?._errors?.reduce((acc, error) => {
      if(error.code?.startsWith('ENABLEWHEN') || error.code?.startsWith('INVALID_QUESTION')) {
        acc.push(error.message);
      }
      return acc;
    }, []);
    return messages?.length ? messages : null;
  }

  /**
   * Get fields to show.
   */
  getFields(rowFormProperty: ObjectProperty): any[] {
    let ret: any[] = [];
    const answerType = rowFormProperty.getProperty('__$answerType').value;
    ret = this.formProperty.schema.widget.showFields.filter((f) => {
      return this.includeField(answerType, f.field);
    });
    return ret;
  }


  /**
   * Match data type of the source to answer[x] field.
   *
   * @param answerType - Type of the source item.
   * @param answerField - One of the answer[x].
   */
  includeField(answerType: string, answerField: string): boolean {
    // Assume answerType empty for answerString field.
    const ret: boolean = !answerType && answerField === 'answerString';
    return ret || !Util.isAnswerField(answerField) || Util.getAnswerFieldName(answerType) === answerField;
  }

  /**
   * Handle error identified by the table cell co-ordinates.
   * @param rowIndex - tr index of the table
   * @param colIndex - td index of tr
   * @param formProperty - Form property of the identified field.
   */
  onError(rowIndex: number, colIndex: number, fieldProperty: FormProperty) {
    const errorMessages = this.getFieldErrors(fieldProperty);

    // Set dom attributes after the UI is updated.
    setTimeout(() => {
      this.setErrorState(!!errorMessages, rowIndex, colIndex);
    });
  }


  /**
   * Set or remove error related attributes of the field control.
   * @param isError - Indicates wether to add or remove the attributes.
   * @param rowIndex - Identify the row
   * @param colIndex - Identify the cell.
   */
  setErrorState(isError: boolean, rowIndex: number, colIndex: number) {
    const cell = this.elementRef.nativeElement.querySelector(`tbody tr:nth-child(${rowIndex+1}) td:nth-child(${colIndex+1})`);
    const el = cell.querySelector('input,textarea,select');
    if(el) {
      const errEl = cell.nextElementSibling.querySelector('button.answerXErrors');
      if(isError) {
        this.renderer.setAttribute(el,'aria-invalid','true');
        this.renderer.setAttribute(el,'aria-errormessage', errEl ? errEl.getAttribute('id') : null);
      }
      else {
        this.renderer.removeAttribute(el,'aria-invalid');
        this.renderer.removeAttribute(el,'aria-errormessage');
      }
    }
  }

  /**
   * Remove the enableWhen error (if found) from the TreeNodeStatusMap.
   *
   * After calling the parent class api to delete the enableWhen condition, invoke the
   * 'updateDeletedEnableWhenValidationStatus' function to also remove the corresponding
   * enableWhen error (if found) from the TreeNodeStatusMap. In the same function, update
   * the key indices of any remaining enableWhen errors that require adjustment.
   *
   * @param formProperty - The row represented by its form property.
   */
  removeItem(formProperty) {
    const props = this.formProperty.properties as FormProperty [];
    const propIndex = props.findIndex((e) => e === formProperty);
    const treeNodeId = this.formProperty.searchProperty(FormService.TREE_NODE_ID).value
    const linkId = this.formProperty.searchProperty('/linkId').value
    
    super.removeItem(formProperty);
    this.formService.updateDeletedEnableWhenValidationStatus(treeNodeId, propIndex);
  }
}

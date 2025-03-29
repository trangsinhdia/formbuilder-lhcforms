import React, { useEffect, useState } from 'react';
import { ElementChooser } from '../element-chooser/ElementChooser';
import { FormProperty } from '../../../types/FormProperty';
import { Widget } from '../../../types/Widget';

interface FormElementProps {
  formProperty: FormProperty;
  nolabel?: boolean;
  layout?: string;
  labelWidthClass?: string;
  controlWidthClass?: string;
  booleanControlled?: boolean;
  booleanLabel?: string;
}

let seqNum = 0;

export const FormElement: React.FC<FormElementProps> = ({
  formProperty,
  nolabel = false,
  layout,
  labelWidthClass,
  controlWidthClass,
  booleanControlled = false,
  booleanLabel
}) => {
  const [widget, setWidget] = useState<Widget | null>(null);

  const setCanonicalId = (widget: Widget) => {
    const parentId = formProperty.parent?.canonicalPathNotation;
    if (parentId) {
      let id = parentId + formProperty.canonicalPathNotation.replace(/^.*\./, '.');
      id = `${id}_${seqNum++}`;
      if (formProperty.root?.rootName) {
        id = `${formProperty.root.rootName}:${id}`;
      }
      widget.name = id;
      widget.id = id;
    }
  };

  const onWidgetInstantiated = (newWidget: Widget) => {
    setCanonicalId(newWidget);
    newWidget.nolabel = nolabel;
    newWidget.layout = layout;
    newWidget.labelWidthClass = labelWidthClass;
    newWidget.controlWidthClass = controlWidthClass;
    setWidget(newWidget);
  };

  if (!formProperty.visible) {
    return null;
  }

  return (
    <div 
      className={`
        ${!formProperty.valid ? 'has-error' : ''}
        ${formProperty.valid ? 'has-success' : ''}
      `}
    >
      <ElementChooser
        nolabel={nolabel}
        layout={layout}
        labelWidthClass={labelWidthClass}
        booleanControlled={booleanControlled}
        booleanLabel={booleanLabel}
        onWidgetInstantiated={onWidgetInstantiated}
        widgetInfo={formProperty.schema.widget}
      />
      {/* TODO: Implement FormElementAction component if needed */}
      {/*buttons?.map((button, index) => (
        <FormElementAction
          key={index}
          button={button}
          formProperty={formProperty}
        />
      ))*/}
    </div>
  );
};
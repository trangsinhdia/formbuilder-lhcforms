import React, { useEffect, useRef } from 'react';
import { Widget } from '../../../types/Widget';
import { WidgetInfo } from '../../../types/WidgetInfo';
import { useWidgetRegistry } from '../../../hooks/useWidgetRegistry';

interface ElementChooserProps {
  widgetInfo: WidgetInfo;
  nolabel?: boolean;
  layout?: string;
  labelWidthClass?: string;
  controlWidthClass?: string;
  booleanControlled?: boolean;
  booleanLabel?: string;
  onWidgetInstantiated?: (widget: Widget) => void;
}

export const ElementChooser: React.FC<ElementChooserProps> = ({
  widgetInfo,
  nolabel = true,
  layout,
  labelWidthClass,
  controlWidthClass,
  booleanControlled = false,
  booleanLabel,
  onWidgetInstantiated
}) => {
  const targetRef = useRef<HTMLDivElement>(null);
  const { getWidget } = useWidgetRegistry();

  useEffect(() => {
    if (!widgetInfo || !targetRef.current) return;

    const WidgetComponent = getWidget(widgetInfo.id);
    if (!WidgetComponent) {
      console.warn(`Widget ${widgetInfo.id} not found in registry`);
      return;
    }

    const widget: Widget = {
      id: widgetInfo.id,
      name: widgetInfo.id,
      nolabel,
      layout,
      labelWidthClass,
      controlWidthClass
    };

    onWidgetInstantiated?.(widget);
  }, [widgetInfo, nolabel, layout, labelWidthClass, controlWidthClass, onWidgetInstantiated]);

  if (!widgetInfo) {
    return null;
  }

  const WidgetComponent = getWidget(widgetInfo.id);
  if (!WidgetComponent) {
    return <div>Widget not found: {widgetInfo.id}</div>;
  }

  return (
    <div ref={targetRef}>
      <WidgetComponent
        nolabel={nolabel}
        layout={layout}
        labelWidthClass={labelWidthClass}
        controlWidthClass={controlWidthClass}
        booleanControlled={booleanControlled}
        booleanLabel={booleanLabel}
      />
    </div>
  );
};
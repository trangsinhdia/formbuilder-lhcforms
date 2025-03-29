/**
 * Form related helper functions.
 */
import { createContext, useContext } from 'react';
import { TreeNode } from '../types/TreeNode';
import jsonTraverse from 'traverse';
import { JsonPointer } from 'json-ptr';
import { loadLForms, getSupportedLFormsVersions } from 'lforms-loader';

// Configuration files
import ngxItemSchema from '../assets/ngx-item.schema.json5';
import fhirSchemaDefinitions from '../assets/fhir-definitions.schema.json5';
import itemLayout from '../assets/items-layout.json5';
import ngxFlSchema from '../assets/ngx-fl.schema.json5';
import flLayout from '../assets/fl-fields-layout.json5';
import itemEditorSchema from '../assets/item-editor.schema.json5';
import { GuidingStep } from '../types/GuidingStep';

declare var LForms: any;

export interface ErrorNode {
  [fieldName: string]: any[];
}

export interface TreeNodeStatus {
  treeNodeId: string;
  linkId: string;
  hasError?: boolean;
  childHasError?: boolean;
  errorMessage?: string;
  errors?: ErrorNode;
}

export type TreeNodeStatusMap = {
  [key: string]: TreeNodeStatus;
};

export type LinkIdTrackerMap = {
  [linkIdKey: string]: string[];
};

class FormService {
  static readonly TREE_NODE_ID = "__$treeNodeId";
  private _loading = false;
  private _lformsVersion = '';
  private _lformsErrorMessage: string | null = null;
  private _windowOpenerUrl: string | null = null;

  treeModel: any = null; // Will be replaced with proper tree model type
  itemSchema: any = { properties: {} };
  flSchema: any = { properties: {} };
  private _itemEditorSchema: any = { properties: {} };

  snomedUser = false;
  treeNodeStatusMap: TreeNodeStatusMap = {};
  linkIdTracker: LinkIdTrackerMap = {};

  // All operators
  operatorOptions: any[] = [
    { option: 'exists', label: 'Not empty' },
    { option: 'notexists', label: 'Empty' },
    { option: '=', label: '=' },
    { option: '!=', label: '!=' },
    { option: '>', label: '>' },
    { option: '<', label: '<' },
    { option: '>=', label: '>=' },
    { option: '<=', label: '<=' }
  ];

  // A subset of operators for certain types
  operatorOptions2: any[] = this.operatorOptions.filter((e) => {
    return (
      e.option === 'exists' ||
      e.option === 'notexists' ||
      e.option === '=' ||
      e.option === '!='
    );
  });

  // Operators based on type.
  enableWhenOperatorOptions = {
    decimal: this.operatorOptions,
    integer: this.operatorOptions,
    quantity: this.operatorOptions,
    date: this.operatorOptions,
    dateTime: this.operatorOptions,
    time: this.operatorOptions,
    string: this.operatorOptions,
    text: this.operatorOptions,
    url: this.operatorOptions2,
    boolean: this.operatorOptions2,
    coding: this.operatorOptions2,
    attachment: this.operatorOptions2,
    reference: this.operatorOptions2
  };

  constructor() {
    [
      { schema: ngxItemSchema as any, layout: itemLayout },
      { schema: ngxFlSchema as any, layout: flLayout }
    ].forEach((obj) => {
      if (!obj.schema.definitions) {
        obj.schema.definitions = {};
      }
      obj.schema.definitions = fhirSchemaDefinitions.definitions as any;
      obj.schema.formLayout = obj.layout.formLayout;
      this.overrideSchemaWidgetFromLayout(obj.schema, obj.layout);
      this.overrideFieldLabelsFromLayout(obj.schema, obj.layout);
    });
    this.itemSchema = ngxItemSchema;
    this.flSchema = ngxFlSchema;
    this._itemEditorSchema = itemEditorSchema;

    // Load lforms.
    this.loadLFormsLib().then((loadedVersion: string) => {
      this._lformsVersion = LForms.lformsVersion;
    }).catch((error) => {
      console.error(error);
      this._lformsVersion = 'ERROR';
      this._lformsErrorMessage = error.message;
    });
  }

  /**
   * Load LForms library
   */
  private async loadLFormsLib(): Promise<string> {
    try {
      await loadLForms();
      return LForms.lformsVersion;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Override schema.widget with widget definitions from layout.
   */
  private overrideSchemaWidgetFromLayout(schema: any, { widgets, widgetsMap }: any) {
    if (!widgetsMap || !widgets) {
      return;
    }

    Object.keys(widgetsMap).forEach((widgetType) => {
      const widgetInfo = widgets[widgetType];
      if (widgetInfo) {
        const fieldPtrs: string[] = widgetsMap[widgetType];
        fieldPtrs?.forEach((ptr) => {
          const fieldSchema: any = JsonPointer.get(schema, ptr);
          if (fieldSchema) {
            fieldSchema.widget = widgetInfo;
          }
        });
      }
    });
  }

  /**
   * Override field labels with custom labels
   */
  private overrideFieldLabelsFromLayout(schema: any, { overridePropertyLabels }: any) {
    if (!overridePropertyLabels) {
      return;
    }

    Object.entries(overridePropertyLabels).forEach(([ptr, title]) => {
      const fieldSchema: any = JsonPointer.get(schema, ptr);
      if (fieldSchema) {
        fieldSchema.title = title;
      }
    });
  }

  // Getters and setters
  get itemEditorSchema() {
    return this._itemEditorSchema;
  }

  getItemSchema() {
    return this.itemSchema;
  }

  getFormLevelSchema() {
    return this.flSchema;
  }

  get windowOpenerUrl(): string | null {
    return this._windowOpenerUrl;
  }

  set windowOpenerUrl(url: string) {
    this._windowOpenerUrl = url;
  }

  get lformsVersion(): string {
    return this._lformsVersion;
  }

  get lformsErrorMessage(): string | null {
    return this._lformsErrorMessage;
  }

  get loading(): boolean {
    return this._loading;
  }

  set loading(loading: boolean) {
    this._loading = loading;
  }

  /**
   * Traverses through the tree nodes and returns array of nodes for validation
   */
  loadValidationNodes(): TreeNode[] {
    const validationNodes: TreeNode[] = [];
    const recurse = (node: TreeNode): void => {
      validationNodes.push(node);

      if (node.hasChildren) {
        for (const child of node.children) {
          recurse(child);
        }
      }
    };

    const roots = this.treeModel?.roots;
    if (roots) {
      for (const root of roots) {
        recurse(root);
      }
    }

    return validationNodes;
  }

  /**
   * Walk through the treeModel and populate the TreeNodeStatus
   */
  loadTreeNodeStatusMap(): void {
    const treeNodeStatusMap: TreeNodeStatusMap = {};
    const recurse = (node: TreeNode): void => {
      treeNodeStatusMap[node.data[FormService.TREE_NODE_ID]] = {
        treeNodeId: node.data[FormService.TREE_NODE_ID],
        linkId: node.data.linkId || ''
      };

      if (node.hasChildren) {
        for (const child of node.children) {
          recurse(child);
        }
      }
    };

    if (!this.treeNodeStatusMap || Object.keys(this.treeNodeStatusMap).length === 0) {
      const roots = this.treeModel?.roots;
      if (roots) {
        for (const root of roots) {
          recurse(root);
        }
      }
      this.treeNodeStatusMap = treeNodeStatusMap;
    }
  }

  /**
   * Add Tree Node Status for error tracking
   */
  addTreeNodeStatus(treeNodeId: string, linkId: string): void {
    if (!(treeNodeId in this.treeNodeStatusMap)) {
      this.treeNodeStatusMap[treeNodeId] = {
        treeNodeId: treeNodeId,
        linkId: linkId || ''
      };
    }
  }

  /**
   * Remove the Tree Node Status from error tracking
   */
  deleteTreeNodeStatus(treeNodeId: string): void {
    delete this.treeNodeStatusMap[treeNodeId];
  }

  /**
   * Check if linkId is duplicate
   */
  treeNodeHasDuplicateLinkIdByLinkIdTracker(newLinkId: string, treeNodeId: string): boolean {
    if (!treeNodeId || !this.treeNodeStatusMap) {
      return false;
    }

    return (
      newLinkId in this.linkIdTracker &&
      (this.linkIdTracker[newLinkId].length > 1 ||
        (this.linkIdTracker[newLinkId].length === 1 &&
          this.linkIdTracker[newLinkId].indexOf(treeNodeId.toString()) === -1))
    );
  }

  /**
   * Check if the tree node contains an error
   */
  isTreeNodeHasErrorById(treeNodeId: string, includeChildNodes: boolean = true): boolean {
    if (this.treeNodeStatusMap && this.treeNodeStatusMap[treeNodeId]) {
      const nodeHasError = this.treeNodeStatusMap[treeNodeId].hasError || false;
      if (includeChildNodes) {
        const childNodeHasError = this.treeNodeStatusMap[treeNodeId].childHasError || false;
        return nodeHasError || childNodeHasError;
      }
      return nodeHasError;
    }
    return false;
  }

  /**
   * Check if the focus node contains an error
   */
  isFocusNodeHasError(): boolean {
    if (this.treeModel) {
      const node = this.treeModel.getFocusedNode();
      if (node) {
        return this.isTreeNodeHasErrorById(node.data[FormService.TREE_NODE_ID], false);
      }
    }
    return false;
  }

  /**
   * Get TreeNodeStatus by ID
   */
  getTreeNodeStatusById(treeNodeId: string): TreeNodeStatus | null {
    if (this.treeNodeStatusMap && treeNodeId in this.treeNodeStatusMap) {
      return this.treeNodeStatusMap[treeNodeId];
    }
    return null;
  }

  /**
   * Check if sibling nodes have errors
   */
  siblingHasError(node: TreeNode): boolean {
    if (node.parent && !node.isRoot && node.parent.hasChildren) {
      return node.parent.children.some((n) => {
        const siblingIdStr = n.data[FormService.TREE_NODE_ID];
        return (
          node.data[FormService.TREE_NODE_ID] !== siblingIdStr &&
          (this.treeNodeStatusMap[siblingIdStr]?.hasError ?? false)
        );
      });
    }
    return false;
  }

  /**
   * Remove error status from ancestor nodes
   */
  removeErrorFromAncestorNodes(node: TreeNode): void {
    const nodeIdStr = node.data[FormService.TREE_NODE_ID];
    if (nodeIdStr in this.treeNodeStatusMap) {
      this.treeNodeStatusMap[nodeIdStr].childHasError = false;
    }

    if (
      node.parent &&
      !node.isRoot &&
      (!this.treeNodeStatusMap[nodeIdStr]?.childHasError)
    ) {
      const siblingHasError = this.siblingHasError(node);
      if (!siblingHasError) {
        this.removeErrorFromAncestorNodes(node.parent);
      }
    }
  }

  /**
   * Add error status to ancestor nodes
   */
  addErrorForAncestorNodes(node: TreeNode): void {
    const nodeIdStr = node.data[FormService.TREE_NODE_ID];
    if (nodeIdStr in this.treeNodeStatusMap) {
      this.treeNodeStatusMap[nodeIdStr].childHasError = true;
    }

    if (node.parent && !node.isRoot) {
      this.addErrorForAncestorNodes(node.parent);
    }
  }
}

// Create context
const FormServiceContext = createContext<FormService | null>(null);

// Create hook for using the form service
export const useFormService = () => {
  const context = useContext(FormServiceContext);
  if (!context) {
    throw new Error('useFormService must be used within a FormServiceProvider');
  }
  return context;
};

export { FormService, FormServiceContext };
/**
 * Tree node related types for the form builder
 */

export interface TreeNode {
  id: string | number;
  name: string;
  data: any;
  children?: TreeNode[];
  parent?: TreeNode;
  isExpanded?: boolean;
  isActive?: boolean;
  isFocused?: boolean;
  isSelected?: boolean;
  isHidden?: boolean;
  isRoot?: boolean;
  level?: number;
  position?: number;
  hasChildren?: boolean;
}

export interface TreeModel {
  roots: TreeNode[];
  focusedNode?: TreeNode | null;
  selectedNode?: TreeNode | null;
  expandedNodes: Set<string | number>;
  activeNodes: Set<string | number>;
  getFocusedNode(): TreeNode | null;
  getNodeById(id: string | number): TreeNode | null;
  getNodesByIds(ids: (string | number)[]): TreeNode[];
  getFirstRoot(): TreeNode | null;
  getLastRoot(): TreeNode | null;
  isExpanded(node: TreeNode): boolean;
  isActive(node: TreeNode): boolean;
  isSelected(node: TreeNode): boolean;
  isFocused(node: TreeNode): boolean;
}

export interface TreeNodeStatus {
  treeNodeId: string;
  linkId: string;
  hasError?: boolean;
  childHasError?: boolean;
  errorMessage?: string;
  errors?: ErrorNode;
}

export interface ErrorNode {
  [fieldName: string]: any[];
}

export type TreeNodeStatusMap = {
  [key: string]: TreeNodeStatus;
}

export type LinkIdTrackerMap = {
  [linkIdKey: string]: string[];
}

// Operator options for form validation
export const operatorOptions = [
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
export const operatorOptions2 = operatorOptions.filter((e) => (
  e.option === 'exists' ||
  e.option === 'notexists' ||
  e.option === '=' ||
  e.option === '!='
));

// Operators based on type
export const enableWhenOperatorOptions = {
  decimal: operatorOptions,
  integer: operatorOptions,
  quantity: operatorOptions,
  date: operatorOptions,
  dateTime: operatorOptions,
  time: operatorOptions,
  string: operatorOptions,
  text: operatorOptions,
  url: operatorOptions2,
  boolean: operatorOptions2,
  coding: operatorOptions2,
  attachment: operatorOptions2,
  reference: operatorOptions2
};
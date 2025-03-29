export interface TreeNodeData {
  [key: string]: any;
  linkId?: string;
}

export interface TreeNode {
  data: TreeNodeData;
  parent: TreeNode | null;
  children: TreeNode[];
  hasChildren: boolean;
  isRoot: boolean;
  level: number;
  path: string[];
  index: number;
  position: number;
  isFocused: boolean;
  isExpanded: boolean;
  isSelected: boolean;
  isVisible: boolean;
}
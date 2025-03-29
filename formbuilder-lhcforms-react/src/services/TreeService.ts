import { TreeModel, TreeNode } from '../types/tree';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Service for managing tree-related operations
 */
export class TreeService {
  private treeModel: TreeModel | null = null;
  private nodeFocusSubject = new BehaviorSubject<TreeNode | null>(null);

  /**
   * Get the current tree model
   */
  getTreeModel(): TreeModel | null {
    return this.treeModel;
  }

  /**
   * Set the current tree model
   */
  setTreeModel(model: TreeModel): void {
    this.treeModel = model;
  }

  /**
   * Get the node focus observable
   */
  get nodeFocus(): Observable<TreeNode | null> {
    return this.nodeFocusSubject.asObservable();
  }

  /**
   * Set the focused node
   */
  setFocusedNode(node: TreeNode | null): void {
    this.nodeFocusSubject.next(node);
  }
}
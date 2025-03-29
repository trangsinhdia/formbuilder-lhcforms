import { Subject } from 'rxjs';

export interface AcceptChange {
  newValue: string;
  reject: boolean;
}

export class RestrictionOperatorService {
  private subject = new Subject<AcceptChange>();

  subscribe(callback: (change: AcceptChange) => void) {
    return this.subject.subscribe(callback);
  }

  notifyChange(change: AcceptChange) {
    this.subject.next(change);
  }

  unsubscribe() {
    this.subject.complete();
  }
}
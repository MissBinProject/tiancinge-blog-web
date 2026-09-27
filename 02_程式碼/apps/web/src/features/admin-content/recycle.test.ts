import { describe, expect, it } from 'vitest';
import { isRecycleAction, isRecycleCollection, recycleResourceType } from './recycle';

describe('recycle operations', () => {
  it('accepts only supported collections and actions', () => {
    expect(isRecycleCollection('messages')).toBe(false);
    expect(isRecycleCollection('contact_messages')).toBe(true);
    expect(isRecycleAction('restore')).toBe(true);
    expect(isRecycleAction('delete')).toBe(false);
  });

  it('maps storage collections to audit resource types', () => {
    expect(recycleResourceType('media_assets')).toBe('media_asset');
    expect(recycleResourceType('contact_messages')).toBe('contact_message');
  });
});

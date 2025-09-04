// src/utils/LivePreviewBridge.js
class LivePreviewBridge {
  constructor() {
    this.subscribers = new Map();
    this.canvasData = new Map();
    this.previewData = new Map();
    this.isUpdating = new Set();
  }

  subscribe(fieldId, callback, source = 'preview') {
    const key = `${fieldId}-${source}`;
    this.subscribers.set(key, callback);
    console.log(`🔗 Bridge: Subscribed ${key}`);
  }

  unsubscribe(fieldId, source = 'preview') {
    const key = `${fieldId}-${source}`;
    this.subscribers.delete(key);
    console.log(`🔗 Bridge: Unsubscribed ${key}`);
  }

  // **UPDATED: Transfer complete spreadsheet state including styles**
  updateFromCanvas(fieldId, data) {
    if (this.isUpdating.has(`${fieldId}-canvas`)) return;
    
    console.log('🎯 Bridge: Canvas → Preview (Full Data)', { 
      fieldId, 
      hasData: !!data,
      hasStyles: !!(data?.styles || data?.cellStyles || data?.formatting),
      dataKeys: Object.keys(data || {})
    });
    
    this.canvasData.set(fieldId, data);
    
    const previewCallback = this.subscribers.get(`${fieldId}-preview`);
    if (previewCallback) {
      this.isUpdating.add(`${fieldId}-preview`);
      previewCallback(data, 'canvas');
      setTimeout(() => this.isUpdating.delete(`${fieldId}-preview`), 100);
    }
  }

  updateFromPreview(fieldId, data) {
    if (this.isUpdating.has(`${fieldId}-preview`)) return;
    
    console.log('🎯 Bridge: Preview → Canvas (Full Data)', { 
      fieldId, 
      hasData: !!data,
      hasStyles: !!(data?.styles || data?.cellStyles || data?.formatting),
      dataKeys: Object.keys(data || {})
    });
    
    this.previewData.set(fieldId, data);
    
    const canvasCallback = this.subscribers.get(`${fieldId}-canvas`);
    if (canvasCallback) {
      this.isUpdating.add(`${fieldId}-canvas`);
      canvasCallback(data, 'preview');
      setTimeout(() => this.isUpdating.delete(`${fieldId}-canvas`), 100);
    }
  }

  getCurrentData(fieldId) {
    return this.previewData.get(fieldId) || this.canvasData.get(fieldId);
  }

  clearField(fieldId) {
    this.canvasData.delete(fieldId);
    this.previewData.delete(fieldId);
  }
}

export const livePreviewBridge = new LivePreviewBridge();

if (typeof window !== 'undefined') {
  window.LivePreviewBridge = livePreviewBridge;
}

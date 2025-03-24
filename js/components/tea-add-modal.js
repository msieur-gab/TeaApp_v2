// js/components/tea-add-modal.js

import nfcHandler from '../services/nfc-handler.js';
import qrScannerHandler from '../services/qr-scanner-handler.js';

class TeaAddModal extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.isScanning = false;
    
    // Bind methods
    this._handleSubmit = this._handleSubmit.bind(this);
    this._handleClose = this._handleClose.bind(this);
    this._handleScanNfc = this._handleScanNfc.bind(this);
    this._handleScanQr = this._handleScanQr.bind(this);
  }
  
  connectedCallback() {
    this.render();
    this._addEventListeners();
  }
  
  disconnectedCallback() {
    this._removeEventListeners();
    // Make sure to stop scanners if active
    if (this.isScanning) {
      nfcHandler.stopNFCScanner();
      qrScannerHandler.stopScanner();
      this.isScanning = false;
    }
  }
  
  _addEventListeners() {
    const form = this.shadowRoot.querySelector('#add-tea-form');
    const closeButton = this.shadowRoot.querySelector('.modal-close');
    const cancelButton = this.shadowRoot.querySelector('#cancel-button');
    const scanNfcButton = this.shadowRoot.querySelector('#scan-nfc-button');
    const scanQrButton = this.shadowRoot.querySelector('#scan-qr-button');
    
    if (form) {
      form.addEventListener('submit', this._handleSubmit);
    }
    
    if (closeButton) {
      closeButton.addEventListener('click', this._handleClose);
    }
    
    if (cancelButton) {
      cancelButton.addEventListener('click', this._handleClose);
    }
    
    if (scanNfcButton) {
      scanNfcButton.addEventListener('click', this._handleScanNfc);
    }
    
    if (scanQrButton) {
      scanQrButton.addEventListener('click', this._handleScanQr);
    }
  }
  
  _removeEventListeners() {
    const form = this.shadowRoot.querySelector('#add-tea-form');
    const closeButton = this.shadowRoot.querySelector('.modal-close');
    const cancelButton = this.shadowRoot.querySelector('#cancel-button');
    const scanNfcButton = this.shadowRoot.querySelector('#scan-nfc-button');
    const scanQrButton = this.shadowRoot.querySelector('#scan-qr-button');
    
    if (form) {
      form.removeEventListener('submit', this._handleSubmit);
    }
    
    if (closeButton) {
      closeButton.removeEventListener('click', this._handleClose);
    }
    
    if (cancelButton) {
      cancelButton.removeEventListener('click', this._handleClose);
    }
    
    if (scanNfcButton) {
      scanNfcButton.removeEventListener('click', this._handleScanNfc);
    }
    
    if (scanQrButton) {
      scanQrButton.removeEventListener('click', this._handleScanQr);
    }
  }
  
  async _handleScanQr() {
    if (this.isScanning) {
      return;
    }
    
    this.isScanning = true;
    
    // Update UI to show scanning state
    const scanQrButton = this.shadowRoot.querySelector('#scan-qr-button');
    const scanStatus = this.shadowRoot.querySelector('#scan-status');
    const videoElement = this.shadowRoot.querySelector('#qr-video');
    
    if (scanQrButton) {
      scanQrButton.textContent = 'Scanning...';
      scanQrButton.disabled = true;
    }
    
    if (scanStatus) {
      scanStatus.textContent = 'Point your camera at a QR code...';
      scanStatus.style.display = 'block';
    }
    
    if (videoElement) {
      videoElement.style.display = 'block';
    }
    
    try {
      const result = await qrScannerHandler.startScanner(videoElement);
      
      if (result.success) {
        // Successfully read a QR code
        if (scanStatus) {
          scanStatus.textContent = 'QR code detected! Processing...';
        }
        
        // Emit event with the tea URL
        this.dispatchEvent(new CustomEvent('tea-qr-scanned', {
          bubbles: true,
          composed: true,
          detail: { url: result.url }
        }));
        
        // Close the modal
        this._handleClose();
      } else {
        // Failed to read QR code
        if (scanStatus) {
          scanStatus.textContent = `Error: ${result.error || 'Failed to read QR code'}`;
          scanStatus.style.color = 'red';
        }
      }
    } catch (error) {
      console.error('Error scanning QR code:', error);
      
      if (scanStatus) {
        scanStatus.textContent = `Error: ${error.message || 'Unknown error scanning QR code'}`;
        scanStatus.style.color = 'red';
      }
    } finally {
      this.isScanning = false;
      
      if (scanQrButton) {
        scanQrButton.textContent = 'Scan QR Code';
        scanQrButton.disabled = false;
      }
      
      if (videoElement) {
        videoElement.style.display = 'none';
        // Stop the video stream
        if (videoElement.srcObject) {
          const tracks = videoElement.srcObject.getTracks();
          tracks.forEach(track => track.stop());
          videoElement.srcObject = null;
        }
      }
      
      // Stop the scanner
      qrScannerHandler.stopScanner();
    }
  }
  
  async _handleScanNfc() {
    if (this.isScanning) {
      return;
    }
    
    this.isScanning = true;
    
    // Update UI to show scanning state
    const scanButton = this.shadowRoot.querySelector('#scan-nfc-button');
    const scanStatus = this.shadowRoot.querySelector('#scan-status');
    
    if (scanButton) {
      scanButton.textContent = 'Scanning...';
      scanButton.disabled = true;
    }
    
    if (scanStatus) {
      scanStatus.textContent = 'Bring your NFC tag close to the device...';
      scanStatus.style.display = 'block';
    }
    
    try {
      const result = await nfcHandler.startNFCScanner();
      
      if (result.success) {
        // Successfully read an NFC tag
        if (scanStatus) {
          scanStatus.textContent = 'NFC tag detected! Processing...';
        }
        
        // Emit event with the tea URL
        this.dispatchEvent(new CustomEvent('tea-nfc-scanned', {
          bubbles: true,
          composed: true,
          detail: { url: result.url }
        }));
        
        // Close the modal
        this._handleClose();
      } else {
        // Failed to read NFC tag
        if (scanStatus) {
          scanStatus.textContent = `Error: ${result.error || 'Failed to read NFC tag'}`;
          scanStatus.style.color = 'red';
        }
      }
    } catch (error) {
      console.error('Error scanning NFC tag:', error);
      
      if (scanStatus) {
        scanStatus.textContent = `Error: ${error.message || 'Unknown error scanning NFC tag'}`;
        scanStatus.style.color = 'red';
      }
    } finally {
      this.isScanning = false;
      
      if (scanButton) {
        scanButton.textContent = 'Scan NFC Tag';
        scanButton.disabled = false;
      }
      
      // Stop the NFC scanner
      nfcHandler.stopNFCScanner();
    }
  }
  
  _handleSubmit(event) {
    event.preventDefault();
    
    // Get form data
    const teaId = this.shadowRoot.querySelector('#tea-id')?.value.trim();
    const teaName = this.shadowRoot.querySelector('#tea-name')?.value.trim();
    const teaCategory = this.shadowRoot.querySelector('#tea-category')?.value;
    const teaOrigin = this.shadowRoot.querySelector('#tea-origin')?.value.trim();
    
    // Validate inputs
    if (!teaId && !teaName) {
      this._showError('Please enter either a Tea ID or Tea Name');
      return;
    }
    
    // Dispatch event with form data
    this.dispatchEvent(new CustomEvent('tea-add-submit', {
      bubbles: true,
      composed: true,
      detail: {
        teaId,
        teaName,
        teaCategory,
        teaOrigin
      }
    }));
    
    // Close the modal
    this._handleClose();
  }
  
  _handleClose() {
    // Stop scanners if active
    if (this.isScanning) {
      nfcHandler.stopNFCScanner();
      qrScannerHandler.stopScanner();
      this.isScanning = false;
    }
    
    // Stop video if active
    const videoElement = this.shadowRoot.querySelector('#qr-video');
    if (videoElement && videoElement.srcObject) {
      const tracks = videoElement.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoElement.srcObject = null;
    }
    
    // Dispatch close event
    this.dispatchEvent(new CustomEvent('tea-add-close', {
      bubbles: true,
      composed: true
    }));
    
    // Reset form
    const form = this.shadowRoot.querySelector('#add-tea-form');
    if (form) {
      form.reset();
    }
    
    // Reset scan status
    const scanStatus = this.shadowRoot.querySelector('#scan-status');
    if (scanStatus) {
      scanStatus.textContent = '';
      scanStatus.style.display = 'none';
      scanStatus.style.color = '';
    }
    
    // Reset scan button
    const scanNfcButton = this.shadowRoot.querySelector('#scan-nfc-button');
    if (scanNfcButton) {
      scanNfcButton.textContent = 'Scan NFC Tag';
      scanNfcButton.disabled = false;
    }
    
    const scanQrButton = this.shadowRoot.querySelector('#scan-qr-button');
    if (scanQrButton) {
      scanQrButton.textContent = 'Scan QR Code';
      scanQrButton.disabled = false;
    }
    
    // Hide video element
    if (videoElement) {
      videoElement.style.display = 'none';
    }
  }
  
  _showError(message) {
    const errorElement = this.shadowRoot.querySelector('#form-error');
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
      
      // Hide after 3 seconds
      setTimeout(() => {
        errorElement.style.display = 'none';
      }, 3000);
    }
  }
  
  render() {
    const isNfcSupported = nfcHandler.isNfcSupported();
    const isQrSupported = qrScannerHandler?.isSupported() || false;
    
    const styles = `
      :host {
        display: none; /* Hidden by default */
      }
      
      .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
      }
      
      .modal-content {
        background-color: white;
        border-radius: 8px;
        width: 90%;
        max-width: 500px;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      }
      
      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px;
        border-bottom: 1px solid #eee;
      }
      
      .modal-title {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 500;
      }
      
      .modal-close {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: #666;
      }
      
      .modal-body {
        padding: 16px;
      }
      
      .form-group {
        margin-bottom: 16px;
      }
      
      .form-group label {
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
      }
      
      .form-group input,
      .form-group select {
        width: 100%;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 16px;
      }
      
      .form-divider {
        text-align: center;
        position: relative;
        margin: 20px 0;
      }
      
      .form-divider::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 0;
        right: 0;
        height: 1px;
        background-color: #eee;
        z-index: 1;
      }
      
      .form-divider-text {
        display: inline-block;
        position: relative;
        padding: 0 10px;
        background-color: white;
        z-index: 2;
        color: #666;
      }
      
      .scan-section {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        justify-content: center;
        margin-bottom: 20px;
      }
      
      .nfc-section {
        margin-bottom: 20px;
        text-align: center;
        ${isNfcSupported ? '' : 'display: none;'}
      }
      
      .qr-section {
        margin-bottom: 20px;
        text-align: center;
        ${isQrSupported ? '' : 'display: none;'}
      }
      
      .scan-button {
        background-color: #4a90e2;
        color: white;
        border: none;
        border-radius: 8px;
        padding: 12px 20px;
        font-size: 16px;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.2s ease;
      }
      
      .scan-button:hover {
        background-color: #3a80d2;
      }
      
      .scan-button:disabled {
        background-color: #ccc;
        cursor: not-allowed;
      }
      
      .scan-status {
        margin-top: 10px;
        font-style: italic;
        color: #666;
        display: none;
      }
      
      #qr-video {
        display: none;
        width: 100%;
        max-width: 300px;
        height: auto;
        margin: 10px auto;
        border-radius: 8px;
        border: 1px solid #ccc;
      }
      
      .scan-not-supported {
        margin-bottom: 20px;
        padding: 10px;
        background-color: #f8f8f8;
        border-radius: 4px;
        color: #666;
        text-align: center;
        ${isNfcSupported || isQrSupported ? 'display: none;' : ''}
      }
      
      .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 20px;
      }
      
      .btn-secondary {
        background-color: #f0f0f0;
        color: #333;
        border: none;
        border-radius: 4px;
        padding: 10px 16px;
        font-size: 16px;
        cursor: pointer;
      }
      
      .btn-primary {
        background-color: #4a90e2;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 10px 16px;
        font-size: 16px;
        cursor: pointer;
      }
      
      .btn-secondary:hover {
        background-color: #e0e0e0;
      }
      
      .btn-primary:hover {
        background-color: #3a80d2;
      }
      
      #form-error {
        color: #d9534f;
        margin-bottom: 15px;
        padding: 8px;
        background-color: #fdf7f7;
        border-radius: 4px;
        display: none;
      }
    `;
    
    this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      <div class="modal-backdrop">
        <div class="modal-content">
          <div class="modal-header">
            <h2 class="modal-title">Add Tea</h2>
            <button class="modal-close">&times;</button>
          </div>
          <div class="modal-body">
            <div id="form-error"></div>
            
            <div class="scan-section">
              <div class="qr-section">
                <button id="scan-qr-button" class="scan-button">Scan QR Code</button>
              </div>
              
              <div class="nfc-section">
                <button id="scan-nfc-button" class="scan-button">Scan NFC Tag</button>
              </div>
            </div>
            
            <video id="qr-video" muted playsinline></video>
            <div id="scan-status" class="scan-status"></div>
            
            <div class="scan-not-supported">
              <p>Camera and NFC scanning are not supported in this browser or device.</p>
            </div>
            
            <div class="form-divider">
              <span class="form-divider-text">OR ENTER MANUALLY</span>
            </div>
            
            <form id="add-tea-form">
              <div class="form-group">
                <label for="tea-id">Tea ID</label>
                <input type="text" id="tea-id" placeholder="Enter tea ID (e.g., 000, 010)">
              </div>
              
              <div class="form-divider">
                <span class="form-divider-text">OR</span>
              </div>
              
              <div class="form-group">
                <label for="tea-name">Tea Name</label>
                <input type="text" id="tea-name" placeholder="e.g., Dragon Well">
              </div>
              
              <div class="form-group">
                <label for="tea-category">Category</label>
                <select id="tea-category">
                  <option value="Green">Green</option>
                  <option value="Black">Black</option>
                  <option value="Oolong">Oolong</option>
                  <option value="White">White</option>
                  <option value="Pu-erh">Pu-erh</option>
                  <option value="Yellow">Yellow</option>
                  <option value="Herbal">Herbal</option>
                </select>
              </div>
              
              <div class="form-group">
                <label for="tea-origin">Origin</label>
                <input type="text" id="tea-origin" placeholder="e.g., Hangzhou, China">
              </div>
              
              <div class="form-actions">
                <button type="button" id="cancel-button" class="btn-secondary">Cancel</button>
                <button type="submit" class="btn-primary">Add Tea</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('tea-add-modal', TeaAddModal);

export default TeaAddModal;
// js/services/qr-scanner-handler.js

class QRScannerHandler {
  constructor() {
    this.isScanning = false;
    this.scanner = null;
    this.baseUrl = this.getBaseUrl();
    this.teaFolder = 'tea/';
  }

  getBaseUrl() {
    const url = new URL(window.location.href);
    let pathname = url.pathname;
    
    // Remove index.html or other files from the path
    pathname = pathname.replace(/\/[^\/]*\.[^\/]*$/, '/');
    
    // Ensure the path ends with a slash
    if (!pathname.endsWith('/')) {
      pathname += '/';
    }
    
    return url.origin + pathname;
  }

  async startScanner(videoElement) {
    if (this.isScanning) {
      return;
    }

    try {
      // Import the QR code scanner library dynamically
      // We'll use the jsQR library which is small and works well
      if (!window.jsQR) {
        await this.loadJsQR();
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return { success: false, error: 'Camera access not supported in this browser' };
      }

      this.isScanning = true;
      
      // Access the device camera
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      
      videoElement.srcObject = stream;
      
      // Wait for video to be ready
      await new Promise(resolve => {
        videoElement.onloadedmetadata = () => {
          videoElement.play();
          resolve();
        };
      });
      
      // Set up canvas for image processing
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      
      // Start scanning loop
      return new Promise((resolve) => {
        const scanFrame = () => {
          if (!this.isScanning) {
            if (videoElement.srcObject) {
              const tracks = videoElement.srcObject.getTracks();
              tracks.forEach(track => track.stop());
              videoElement.srcObject = null;
            }
            return;
          }
          
          if (videoElement.readyState === videoElement.HAVE_ENOUGH_DATA) {
            // Draw video frame to canvas
            context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
            
            // Get image data for QR code scanning
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            
            // Scan for QR code
            const code = window.jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: "dontInvert",
            });
            
            if (code) {
              // QR code found!
              this.stopScanner();
              const url = this.processQRData(code.data);
              resolve({ success: true, url });
              return;
            }
          }
          
          // Continue scanning
          requestAnimationFrame(scanFrame);
        };
        
        // Start the scanning loop
        scanFrame();
      });
      
    } catch (error) {
      console.error('Error starting QR scanner:', error);
      this.isScanning = false;
      return { success: false, error: error.message };
    }
  }
  
  stopScanner() {
    this.isScanning = false;
  }
  
  processQRData(data) {
    // The same processing as NFC data
    try {
      // Option 1: Handle direct tea ID (like "001")
      if (/^\d+$/.test(data.trim())) {
        const teaId = data.trim();
        return `${this.baseUrl}${this.teaFolder}${teaId}.cha`;
      }
      
      // Try to create a URL object to parse the URL
      let parsedUrl;
      try {
        parsedUrl = new URL(data);
      } catch (e) {
        // If it's not a valid URL, treat it as a tea ID
        return `${this.baseUrl}${this.teaFolder}${data.trim()}.cha`;
      }
      
      // Option 2: Handle URL with query parameter format (/?tea=000.cha)
      if (parsedUrl.searchParams.has('tea')) {
        const teaFile = parsedUrl.searchParams.get('tea');
        return `${this.baseUrl}${this.teaFolder}${teaFile}`;
      }
      
      // Option 3: Handle URL with query parameter format (/?teaId=000)
      if (parsedUrl.searchParams.has('teaId')) {
        const teaId = parsedUrl.searchParams.get('teaId');
        return `${this.baseUrl}${this.teaFolder}${teaId}.cha`;
      }
      
      // Option 4: Handle direct path to tea file (/tea/000.cha)
      if (data.includes('/tea/') && (data.endsWith('.cha') || data.endsWith('.json'))) {
        return data;
      }
      
      // If none of the above formats match, return the original URL
      return data;
      
    } catch (error) {
      console.error('Error processing QR code data:', error);
      // If there's an error parsing the data, just return the original
      return data;
    }
  }
  
  // Load the jsQR library dynamically
  async loadJsQR() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  
  isSupported() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }
}

// Export as singleton
const qrScannerHandler = new QRScannerHandler();
export default qrScannerHandler;
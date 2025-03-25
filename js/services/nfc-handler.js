// js/services/nfc-handler.js

class NFCHandler {
    constructor() {
      this.isReading = false;
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
  
    async startNFCScanner() {
      if (!('NDEFReader' in window)) {
        console.error('Web NFC API is not supported in this browser');
        return { success: false, error: 'NFC not supported in this browser' };
      }
  
      try {
        this.reader = new NDEFReader();
        await this.reader.scan();
        
        this.isReading = true;
        console.log('NFC scanner started');
        
        // Return a promise that will resolve when an NFC tag is read
        return new Promise((resolve) => {
          this.reader.onreading = ({ message }) => {
            const url = this.processNfcMessage(message);
            if (url) {
              resolve({ success: true, url });
            }
          };
          
          this.reader.onreadingerror = (error) => {
            console.error('Error reading NFC tag:', error);
            resolve({ success: false, error: 'Failed to read NFC tag' });
          };
        });
      } catch (error) {
        console.error('Error starting NFC scanner:', error);
        return { success: false, error: error.message };
      }
    }
  
    stopNFCScanner() {
      if (this.reader) {
        this.reader.onreading = null;
        this.reader.onreadingerror = null;
        this.isReading = false;
        console.log('NFC scanner stopped');
      }
    }
  
    processNfcMessage(message) {
      // Process the NDEF message
      for (const record of message.records) {
        if (record.recordType === "url") {
          // Convert the payload to a string
          const textDecoder = new TextDecoder();
          const url = textDecoder.decode(record.data);
          
          console.log('NFC tag URL:', url);
          return this.processNfcUrl(url);
        } else if (record.recordType === "text") {
          const textDecoder = new TextDecoder();
          const text = textDecoder.decode(record.data);
          
          console.log('NFC tag text:', text);
          return this.processNfcUrl(text);
        }
      }
      
      return null;
    }
    
    processNfcUrl(url) {
      try {
        // Option 1: Handle direct tea ID (like "001")
        if (/^\d+$/.test(url.trim())) {
          const teaId = url.trim();
          return `${this.baseUrl}${this.teaFolder}${teaId}.cha`;
        }
        
        // Try to create a URL object to parse the URL
        let parsedUrl;
        try {
          parsedUrl = new URL(url);
        } catch (e) {
          // If it's not a valid URL, treat it as a tea ID
          return `${this.baseUrl}${this.teaFolder}${url.trim()}.cha`;
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
        if (url.includes('/tea/') && (url.endsWith('.cha') || url.endsWith('.json'))) {
          return url;
        }
        
        // If none of the above formats match, return the original URL
        console.log('Using original URL:', url);
        return url;
        
      } catch (error) {
        console.error('Error processing NFC URL:', error);
        // If there's an error parsing the URL, just return the original
        return url;
      }
    }
  
    isNfcSupported() {
      return 'NDEFReader' in window;
    }
  }
  
  // Export as singleton
  const nfcHandler = new NFCHandler();
  export default nfcHandler;
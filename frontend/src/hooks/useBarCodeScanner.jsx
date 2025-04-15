import { useState, useEffect } from 'react';

const useBarcodeScanner = (onScanComplete) => {
  const [barcodeBuffer, setBarcodeBuffer] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    const handleBarcodeScan = (event) => {
      if (event.key === 'Enter' && barcodeBuffer) {
        onScanComplete(barcodeBuffer);
        setBarcodeBuffer('');
        setIsScanning(false);
      } else if (event.key.length === 1 && !isScanning) {
        setBarcodeBuffer((prev) => prev + event.key);
        setIsScanning(true);
      }
    };

    window.addEventListener('keydown', handleBarcodeScan);
    return () => window.removeEventListener('keydown', handleBarcodeScan);
  }, [barcodeBuffer, isScanning, onScanComplete]);

  return { barcodeBuffer, isScanning };
};

export default useBarcodeScanner;
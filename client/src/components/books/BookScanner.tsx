import React, { useEffect, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import api from '../../services/api';
import BookForm from './BookForm';

interface BookScannerProps {
  onClose: () => void;
  onSuccess: () => void;
}

const BookScanner: React.FC<BookScannerProps> = ({ onClose, onSuccess }) => {
  const [scanData, setScanData] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [scanner, setScanner] = useState<Html5Qrcode | null>(null);

  useEffect(() => {
    const html5QrCode = new Html5Qrcode("reader");
    setScanner(html5QrCode);

    Html5Qrcode.getCameras()
      .then(devices => {
        if (devices && devices.length) {
          setCameras(devices);
          // Try to find the back camera first (usually better for scanning)
          const backCamera = devices.find(camera => 
            camera.label.toLowerCase().includes('back')
          );
          // Default to the first camera if no back camera is found
          setSelectedCamera(backCamera ? backCamera.id : devices[0].id);
        }
      })
      .catch(err => {
        console.error('Error getting cameras', err);
        setError('Error accessing cameras');
      });

    return () => {
      if (html5QrCode.isScanning) {
        html5QrCode.stop().catch(console.error);
      }
    };
  }, []);

  useEffect(() => {
    if (scanner && selectedCamera) {
      startScanning();
    }
  }, [selectedCamera]);

  const startScanning = async () => {
    if (!scanner) return;

    try {
      if (scanner.isScanning) {
        await scanner.stop();
      }

      await scanner.start(
        selectedCamera,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          disableFlip: false, // Allow image flip
          videoConstraints: {
            facingMode: "environment"
          }
        },
        handleScanSuccess,
        (errorMessage) => {
          // Only log errors that aren't related to scanning attempts
          if (!errorMessage.includes("No MultiFormat Readers")) {
            console.log(errorMessage);
          }
        }
      );
    } catch (err) {
      console.error('Error starting scanner:', err);
      setError('Error starting scanner');
    }
  };

  const handleScanSuccess = async (decodedText: string) => {
    console.log("Scanned result:", decodedText); // Debug log
    if (scanner) {
      await scanner.stop();
    }
    setLoading(true);
    setError(''); // Clear any previous errors
    
    try {
      // Assuming the QR code contains ISBN
      const isbn = decodedText;
      
      try {
        // First check if book exists in our database
        const localBook = await api.get(`/books/isbn/${isbn}`);
        if (localBook.data) {
          setScanData({
            ...localBook.data,
            quantity: localBook.data.quantity + 1
          });
          return;
        }
      } catch (error: any) {
        // If 404, continue to Google Books API
        if (error.response?.status !== 404) {
          throw error;
        }
      }

      // If not in database, fetch from Google Books API
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`
      );
      const data = await response.json();

      if (data.items && data.items[0]) {
        const bookInfo = data.items[0].volumeInfo;
        setScanData({
          title: bookInfo.title,
          author: bookInfo.authors ? bookInfo.authors[0] : '',
          isbn: isbn,
          quantity: 1,
          book_category: bookInfo.categories ? bookInfo.categories[0] : '',
          barcode: isbn
        });
      } else {
        setError('Book not found in Google Books API');
        // Restart scanning after error
        startScanning();
      }
    } catch (error: any) {
      console.error('Error fetching book data:', error);
      setError(error.response?.data?.message || 'Error fetching book data');
      // Restart scanning after error
      startScanning();
    } finally {
      setLoading(false);
    }
  };

  const handleCameraChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCamera(e.target.value);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Scan Book QR Code</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        
        {!scanData && (
          <div className="mb-4">
            {cameras.length > 1 && (
              <select
                value={selectedCamera}
                onChange={handleCameraChange}
                className="mb-4 p-2 border rounded w-full"
              >
                {cameras.map(camera => (
                  <option key={camera.id} value={camera.id}>
                    {camera.label}
                  </option>
                ))}
              </select>
            )}
            <div id="reader" className="w-full"></div>
            {error && <p className="text-red-500 mt-2">{error}</p>}
            {loading && <p className="text-gray-500 mt-2">Loading...</p>}
          </div>
        )}

        {scanData && (
          <BookForm
            initialData={scanData}
            onSuccess={onSuccess}
            onCancel={() => {
              setScanData(null);
              startScanning();
            }}
          />
        )}
      </div>
    </div>
  );
};

export default BookScanner; 
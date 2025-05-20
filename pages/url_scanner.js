import React, { useEffect, useState } from 'react';

export default function UrlScanner() {
    const [url, setUrl] = useState('');

    useEffect(() => {
        alert('UrlScanner component mounted!');
    }, []);

    const handleScan = () => {
        alert(`Scanning: ${url}`);
    };

    return (
        <div style={{ padding: 40, fontSize: 24, color: 'blue' }}>
            {/* Infobox */}
            <div style={{
                border: '1px solid #2196f3',
                background: '#e3f2fd',
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '24px',
                color: '#222',
                fontSize: 18,
                maxWidth: 500
            }}>
                <strong>Info:</strong> Enter a URL below to scan for details and potential issues.
            </div>
            {/* Input and Button */}
            <input
                type="text"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="Enter URL"
                style={{
                    padding: '8px',
                    width: '60%',
                    marginRight: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                    fontSize: 18
                }}
            />
            <button
                onClick={handleScan}
                style={{
                    padding: '8px 16px',
                    background: '#2196f3',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: 18
                }}
            >
                Scan
            </button>
        </div>
    );
}
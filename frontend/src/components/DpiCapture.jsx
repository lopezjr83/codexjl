import { useRef } from 'react';

const compressImage = (file) => new Promise((resolve) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const maxW = 700;
      const ratio = Math.min(1, maxW / img.width);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * ratio);
      canvas.height = Math.round(img.height * ratio);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.65));
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
});

export default function DpiCapture({ value, onChange }) {
  const inputRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressImage(file);
    onChange(compressed);
    e.target.value = '';
  };

  return (
    <div className="dpi-capture">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        style={{ display: 'none' }}
      />
      {value ? (
        <div className="dpi-preview">
          <img src={value} alt="Foto DPI" className="dpi-preview-img" />
          <button type="button" className="ghost" onClick={() => onChange('')}>
            Cambiar foto
          </button>
        </div>
      ) : (
        <button type="button" className="dpi-btn" onClick={() => inputRef.current?.click()}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
          Fotografiar DPI
        </button>
      )}
    </div>
  );
}

import React, { useState } from "react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "../services/firebase";
import imageCompression from "browser-image-compression";
import { Upload, X, CheckCircle, Image as ImageIcon } from "lucide-react";
import { useUI } from "../context/UIContext";

interface ImageUploadProps {
  onUploadComplete: (url: string) => void;
  initialImage?: string;
  folder?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ 
  onUploadComplete, 
  initialImage,
  folder = "menu"
}) => {
  const [preview, setPreview] = useState<string | null>(initialImage || null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { showToast } = useUI();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    if (!file.type.startsWith("image/")) {
      showToast("Please select a valid image file", "error");
      return;
    }

    try {
      setUploading(true);
      setProgress(0);

      // Compress image
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1024,
        useWebWorker: true
      };
      
      const compressedFile = await imageCompression(file, options);
      
      // Update preview immediately
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(compressedFile);

      // Upload to Firebase Storage
      const fileName = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
      const storageRef = ref(storage, `${folder}/${fileName}`);
      const uploadTask = uploadBytesResumable(storageRef, compressedFile);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(p);
        },
        (error) => {
          console.error("Upload error:", error);
          showToast("Failed to upload image", "error");
          setUploading(false);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          onUploadComplete(downloadURL);
          setUploading(false);
          showToast("Image uploaded successfully", "success");
        }
      );
    } catch (err) {
      console.error("Compression error:", err);
      showToast("Failed to process image", "error");
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative group aspect-video bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 overflow-hidden flex items-center justify-center transition-all hover:border-primary/50">
        {preview ? (
          <>
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button 
                type="button"
                onClick={() => {
                  setPreview(null);
                  onUploadComplete("");
                }}
                className="bg-white/20 backdrop-blur-md text-white p-2 rounded-full hover:bg-white/40"
              >
                <X size={20} />
              </button>
            </div>
          </>
        ) : (
          <label className="cursor-pointer flex flex-col items-center gap-2 p-8 text-center text-gray-400 hover:text-primary transition-colors">
            <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center border border-gray-100 mb-2">
              <Upload size={24} />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest">Click to upload photo</span>
            <span className="text-[10px] opacity-70">PNG, JPG up to 10MB</span>
            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={uploading} />
          </label>
        )}

        {uploading && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
             <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-3">
                <div 
                  className="h-full bg-primary transition-all duration-300 rounded-full shadow-[0_0_10px_rgba(200,30,30,0.5)]" 
                  style={{ width: `${progress}%` }} 
                />
             </div>
             <p className="text-[10px] font-black uppercase text-primary tracking-widest">Uploading {Math.round(progress)}%</p>
          </div>
        )}
      </div>

      {preview && !uploading && (
        <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-2 rounded-lg border border-green-100">
          <CheckCircle size={14} />
          <span className="text-[10px] font-bold uppercase tracking-tight">Image processed & ready</span>
        </div>
      )}
    </div>
  );
};

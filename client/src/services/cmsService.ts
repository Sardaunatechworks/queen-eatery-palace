import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "./firebase";
import imageCompression from 'browser-image-compression';

export interface CMSHero {
  title: string;
  subtitle: string;
  imageUrl: string;
}

export interface CMSAbout {
  text: string;
  imageUrl: string;
}

export interface CMSService {
  id: string;
  icon: string; // E.g., 'Utensils', 'MessageSquare', 'Calendar'
  title: string;
  description: string;
}

export interface CMSEventHall {
  description: string;
  imageUrls: string[];
}

export interface CMSContact {
  phone: string;
  address: string;
}

export interface CMSData {
  hero: CMSHero;
  about: CMSAbout;
  services: CMSService[];
  eventHall: CMSEventHall;
  contact: CMSContact;
}

const CMS_DOC_ID = "landing_page";

export const defaultCMSData: CMSData = {
  hero: {
    title: "Simple Food, \nGreat Taste.",
    subtitle: "Experience quality dining and host your special events at Queen Eatery Palace and Event Hall. We keep it simple and professional.",
    imageUrl: "https://images.unsplash.com/photo-1544148103-0773bf10d330?q=80&w=2070&auto=format&fit=crop"
  },
  about: {
    text: "Queen Eatery Palace and Event Hall serves a variety of local and international dishes prepared with care. Our event hall is also open for weddings, meetings, and celebrations in Dutse.",
    imageUrl: "" // Initially empty or a default image
  },
  services: [
    {
      id: "dine-in",
      icon: "Utensils",
      title: "Dine-In",
      description: "Eat comfortably in our well-spaced dining hall with premium service."
    },
    {
      id: "fast-orders",
      icon: "MessageSquare",
      title: "Fast Orders",
      description: "Order online and pick it up or get it delivered to your doorstep."
    },
    {
      id: "event-hall",
      icon: "Calendar",
      title: "Event Hall",
      description: "Large hall with state-of-the-art facilities for weddings and conferences."
    }
  ],
  eventHall: {
    description: "Our event hall is fully equipped with modern facilities. Perfect for weddings and corporate gatherings.",
    imageUrls: [
      "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=2074&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=2069&auto=format&fit=crop"
    ]
  },
  contact: {
    phone: "+234 915 529 0102",
    address: "Behind Dutse Emirs House, \nOpposite Glo Office, Dutse, Jigawa State"
  }
};

export const getCMSContent = async (): Promise<CMSData> => {
  try {
    const docRef = doc(db, "cms_content", CMS_DOC_ID);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { ...defaultCMSData, ...docSnap.data() } as CMSData;
    } else {
      // If no data exists, simply return the default data.
      // We don't write it to DB here because public users lack write permissions.
      return defaultCMSData;
    }
  } catch (error) {
    console.error("CMS Content fetch failed (likely due to missing Firestore rules). Falling back to default data.", error);
    return defaultCMSData;
  }
};

export const updateCMSContent = async (data: CMSData): Promise<void> => {
  try {
    const docRef = doc(db, "cms_content", CMS_DOC_ID);
    await setDoc(docRef, data, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, "cms_content");
  }
};

export const uploadCMSImage = async (file: File, path: string): Promise<string> => {
  try {
    // Compress the image heavily to ensure we don't hit the 1MB Firestore document limit
    const options = {
      maxSizeMB: 0.1, // Max 100KB per image
      maxWidthOrHeight: 1200,
      useWebWorker: true,
      initialQuality: 0.7
    };
    
    const compressedFile = await imageCompression(file, options);
    
    // Convert compressed file to Base64 string
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(compressedFile);
      reader.onloadend = () => {
        const base64data = reader.result as string;
        resolve(base64data);
      };
      reader.onerror = (error) => reject(error);
    });
  } catch (error) {
    console.error("Error converting image to Base64:", error);
    throw new Error("Failed to process image.");
  }
};

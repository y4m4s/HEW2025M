import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";
import { v4 as uuidv4 } from 'uuid';

/**
 * Uploads a file to Firebase Storage and returns the download URL.
 * @param file The file to upload.
 * @param path The path in storage (e.g., 'posts' or 'products').
 * @returns The download URL of the uploaded file.
 */
export const uploadFileToFirebase = async (file: File, folder: string): Promise<string> => {
    if (!file) throw new Error("No file provided");

    // Create a unique filename
    const fileExtension = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const storagePath = `uploads/${folder}/${fileName}`;
    const storageRef = ref(storage, storagePath);

    try {
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL;
    } catch (error) {
        console.error("Error uploading file to Firebase Storage:", error);
        throw error;
    }
};

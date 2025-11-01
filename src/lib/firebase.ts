// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  orderBy,
  limit,
  Timestamp,
  addDoc,
  serverTimestamp,
  updateDoc,
  Firestore,
  or,
} from "firebase/firestore";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

// Your web app's Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase with validation
let app;
let analytics;
let db: Firestore;
let auth;

// Check that essential firebase config values exist
if (firebaseConfig.apiKey && firebaseConfig.projectId) {
  app = initializeApp(firebaseConfig);

  // Only initialize analytics if running in browser and measurementId exists
  if (typeof window !== "undefined" && firebaseConfig.measurementId) {
    analytics = getAnalytics(app);
  }

  db = getFirestore(app);
  auth = getAuth(app);
} else {
  console.error(
    "Firebase configuration is missing essential values. Check your environment variables."
  );
}

// Collection names
export const VOLUNTEERS_COLLECTION = "volunteers";
export const MUSICIANS_COLLECTION = "musicians";
export const DONATIONS_COLLECTION = "donations";
export const ACTIVE_VOLUNTEER_SESSIONS_COLLECTION = "activeVolunteerSessions";
export const COMPLETED_VOLUNTEER_SESSIONS_COLLECTION =
  "completedVolunteerSessions";
export const ACTIVE_MUSICIAN_SESSIONS_COLLECTION = "activeMusicianSessions";
export const COMPLETED_MUSICIAN_SESSIONS_COLLECTION =
  "completedMusicianSessions";
export const CONFIG_COLLECTION = "config";
export const CODE_AUDIT_LOG_COLLECTION = "codeAuditLog";

// Firebase utility functions

/**
 * Save a volunteer to Firestore
 * @param volunteer - The volunteer data to save
 * @returns Promise that resolves when the volunteer is saved
 */
export const saveVolunteer = async (volunteer: any) => {
  try {
    // Create a clean copy of the volunteer object to prepare for storage
    const cleanVolunteer = { ...volunteer };

    // Debug signature information
    console.log("Signature data type:", typeof cleanVolunteer.waiverSignature);
    console.log(
      "Signature data length:",
      typeof cleanVolunteer.waiverSignature === "string"
        ? cleanVolunteer.waiverSignature.length
        : "not a string"
    );

    // Handle waiverSignature - Firestore can't store Blob objects
    if (cleanVolunteer.waiverSignature) {
      // If it's a string, keep it as is (dataURL)
      if (typeof cleanVolunteer.waiverSignature === "string") {
        // All good, already a string
        console.log(
          "Signature is a valid string, length:",
          cleanVolunteer.waiverSignature.length
        );

        // Truncate if extremely long (Firestore has 1MB document size limit)
        if (cleanVolunteer.waiverSignature.length > 900000) {
          // ~900KB limit to be safe
          console.warn("Signature is too large, truncating");
          cleanVolunteer.waiverSignature =
            cleanVolunteer.waiverSignature.substring(0, 900000);
        }
      }
      // If it's an object with blob property, that's the problem
      else if (cleanVolunteer.waiverSignature.blob) {
        console.log("Signature contains blob, extracting dataURL");
        // Just store the dataURL string part and not the blob
        cleanVolunteer.waiverSignature =
          cleanVolunteer.waiverSignature.base64 || "";
      }
      // If we can't handle it, remove it
      else if (typeof cleanVolunteer.waiverSignature !== "string") {
        console.warn(
          "Removing unsupported waiverSignature format:",
          Object.prototype.toString.call(cleanVolunteer.waiverSignature)
        );
        cleanVolunteer.waiverSignature = "";
      }
    } else {
      console.warn("No signature data provided");
    }

    // Use the volunteer's ID as the document ID
    await setDoc(doc(db, VOLUNTEERS_COLLECTION, volunteer.id), cleanVolunteer);
    return { success: true };
  } catch (error) {
    console.error("Error saving volunteer to Firestore:", error);
    return { success: false, error };
  }
};

/**
 * Get a volunteer by ID
 * @param volunteerId - The ID of the volunteer to retrieve
 * @returns The volunteer data or null if not found
 */
export const getVolunteerById = async (volunteerId: string) => {
  try {
    const docRef = doc(db, VOLUNTEERS_COLLECTION, volunteerId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { success: true, data: docSnap.data() };
    } else {
      return { success: false, error: "Volunteer not found" };
    }
  } catch (error) {
    console.error("Error getting volunteer from Firestore:", error);
    return { success: false, error };
  }
};

/**
 * Get all volunteers
 * @returns Array of all volunteers
 */
export const getAllVolunteers = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, VOLUNTEERS_COLLECTION));
    const volunteers: any[] = [];

    querySnapshot.forEach((doc) => {
      volunteers.push({ id: doc.id, ...doc.data() });
    });

    return { success: true, data: volunteers };
  } catch (error) {
    console.error("Error getting all volunteers from Firestore:", error);
    return { success: false, error };
  }
};

/**
 * Save a musician to Firestore
 * @param musician - The musician data to save
 * @returns Promise that resolves when the musician is saved
 */
export const saveMusician = async (musician: any) => {
  try {
    // Use the musician's ID as the document ID
    await setDoc(doc(db, MUSICIANS_COLLECTION, musician.id), musician);
    return { success: true };
  } catch (error) {
    console.error("Error saving musician to Firestore:", error);
    return { success: false, error };
  }
};

/**
 * Get all registered musicians
 * @returns Array of all musicians
 */
export const getAllMusicians = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, MUSICIANS_COLLECTION));
    const musicians: any[] = [];
    querySnapshot.forEach((doc) => {
      musicians.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, data: musicians };
  } catch (error) {
    console.error("Error getting all musicians from Firestore:", error);
    return { success: false, error };
  }
};

/**
 * Save an active volunteer session to Firestore
 * @param sessionData - The session data to save
 * @returns Promise resolving with success status and session ID
 */
export const saveActiveVolunteerSession = async (sessionData: any) => {
  try {
    const sessionId = `${sessionData.volunteerInfo.id}_${Date.now()}`;
    const sessionWithTimestamps = {
      ...sessionData,
      createdAt: Timestamp.now(),
      checkInTimeTimestamp: Timestamp.fromDate(
        new Date(sessionData.checkInTime)
      ),
    };
    await setDoc(
      doc(db, ACTIVE_VOLUNTEER_SESSIONS_COLLECTION, sessionId),
      sessionWithTimestamps
    );
    return { success: true, sessionId };
  } catch (error) {
    console.error("Error saving active volunteer session to Firestore:", error);
    return { success: false, error };
  }
};

/**
 * Complete a volunteer session and move it from active to completed
 * @param sessionId - The ID of the session to complete
 * @param sessionData - The updated session data with checkout information
 * @returns Promise that resolves when the session is completed
 */
export const completeVolunteerSession = async (
  sessionId: string,
  sessionData: any
) => {
  try {
    const completedSession = {
      ...sessionData,
      updatedAt: Timestamp.now(),
      checkOutTimeTimestamp: sessionData.checkOutTime
        ? Timestamp.fromDate(new Date(sessionData.checkOutTime))
        : null,
    };
    await setDoc(
      doc(db, COMPLETED_VOLUNTEER_SESSIONS_COLLECTION, sessionId),
      completedSession
    );
    await deleteDoc(doc(db, ACTIVE_VOLUNTEER_SESSIONS_COLLECTION, sessionId));
    return { success: true };
  } catch (error) {
    console.error("Error completing volunteer session in Firestore:", error);
    return { success: false, error };
  }
};

/**
 * Get active session for a specific volunteer
 * @param volunteerId - The ID of the volunteer
 * @returns The active session data or null if not found
 */
export const getActiveVolunteerSession = async (volunteerId: string) => {
  try {
    const q = query(
      collection(db, ACTIVE_VOLUNTEER_SESSIONS_COLLECTION),
      where("volunteerInfo.id", "==", volunteerId)
    );
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return { success: false, message: "No active session found" };
    }
    const sessionDoc = querySnapshot.docs[0];
    return {
      success: true,
      data: sessionDoc.data(),
      sessionId: sessionDoc.id,
    };
  } catch (error) {
    console.error(
      "Error getting active volunteer session from Firestore:",
      error
    );
    return { success: false, error };
  }
};

/**
 * Get completed sessions for a specific volunteer
 * @param volunteerId - The ID of the volunteer
 * @returns Array of completed sessions for the volunteer
 */
export const getCompletedVolunteerSessions = async (volunteerId: string) => {
  try {
    const q = query(
      collection(db, COMPLETED_VOLUNTEER_SESSIONS_COLLECTION),
      where("volunteerInfo.id", "==", volunteerId),
      orderBy("checkOutTimeTimestamp", "desc")
    );
    const querySnapshot = await getDocs(q);
    const sessions: any[] = [];
    querySnapshot.forEach((doc) => {
      sessions.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, data: sessions };
  } catch (error) {
    console.error(
      "Error getting completed volunteer sessions from Firestore:",
      error
    );
    return { success: false, error };
  }
};

/**
 * Get all active volunteer sessions
 * @returns Array of all active volunteer sessions
 */
export const getAllActiveVolunteerSessions = async () => {
  try {
    const q = query(
      collection(db, ACTIVE_VOLUNTEER_SESSIONS_COLLECTION),
      orderBy("checkInTimeTimestamp", "desc")
    );
    const querySnapshot = await getDocs(q);
    const sessions: any[] = [];
    querySnapshot.forEach((doc) => {
      sessions.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, data: sessions };
  } catch (error) {
    console.error(
      "Error getting all active volunteer sessions from Firestore:",
      error
    );
    return { success: false, error };
  }
};

/**
 * Get all completed volunteer sessions
 * @returns Array of all completed volunteer sessions
 */
export const getAllCompletedVolunteerSessions = async () => {
  try {
    const q = query(
      collection(db, COMPLETED_VOLUNTEER_SESSIONS_COLLECTION),
      orderBy("checkOutTimeTimestamp", "desc")
    );
    const querySnapshot = await getDocs(q);
    const sessions: any[] = [];
    querySnapshot.forEach((doc) => {
      sessions.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, data: sessions };
  } catch (error) {
    console.error(
      "Error getting all completed volunteer sessions from Firestore:",
      error
    );
    return { success: false, error };
  }
};

/**
 * Save an active musician session to Firestore
 * @param sessionData - The session data to save
 * @returns Promise resolving with success status and session ID
 */
export const saveActiveMusicianSession = async (sessionData: any) => {
  try {
    // Ensure musicianId exists
    if (!sessionData.musicianId) {
      throw new Error("musicianId is required to save a musician session.");
    }
    const sessionId = `${sessionData.musicianId}_${Date.now()}`;
    const sessionWithTimestamps = {
      ...sessionData,
      createdAt: Timestamp.now(),
      signInTimeTimestamp: Timestamp.fromDate(new Date(sessionData.signInTime)),
    };
    await setDoc(
      doc(db, ACTIVE_MUSICIAN_SESSIONS_COLLECTION, sessionId),
      sessionWithTimestamps
    );
    return { success: true, sessionId };
  } catch (error) {
    console.error("Error saving active musician session to Firestore:", error);
    return { success: false, error };
  }
};

/**
 * Complete a musician session and move it from active to completed
 * @param sessionId - The ID of the session to complete
 * @param sessionData - The updated session data with checkout information
 * @returns Promise that resolves when the session is completed
 */
export const completeMusicianSession = async (
  sessionId: string,
  sessionData: any
) => {
  try {
    const activeSessionSnap = await getDoc(
      doc(db, ACTIVE_MUSICIAN_SESSIONS_COLLECTION, sessionId)
    );
    if (!activeSessionSnap.exists()) {
      throw new Error("Active session not found");
    }

    const activeData = activeSessionSnap.data();
    const completedSessionData = {
      ...activeData, // Copy data from active session
      checkOutTime: sessionData.checkOutTime, // Add the ISO string checkout time
      checkOutTimeTimestamp: Timestamp.fromDate(
        new Date(sessionData.checkOutTime)
      ), // Add the Timestamp field
    };

    // Add to completed collection
    await setDoc(
      doc(db, COMPLETED_MUSICIAN_SESSIONS_COLLECTION, sessionId),
      completedSessionData
    );
    await deleteDoc(doc(db, ACTIVE_MUSICIAN_SESSIONS_COLLECTION, sessionId));
    return { success: true };
  } catch (error) {
    console.error("Error completing musician session in Firestore:", error);
    return { success: false, error };
  }
};

/**
 * Get a specific active musician session by musician ID
 * @param musicianId The ID of the musician
 * @returns The active session data or null if not found
 */
export const getActiveMusicianSession = async (musicianId: string) => {
  try {
    const q = query(
      collection(db, ACTIVE_MUSICIAN_SESSIONS_COLLECTION),
      where("musicianId", "==", musicianId),
      limit(1)
    );
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const docSnap = querySnapshot.docs[0];
      // Add the document ID to the returned data
      return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
    } else {
      return { success: true, data: null }; // No active session found
    }
  } catch (error) {
    console.error("Error getting active musician session:", error);
    return { success: false, error };
  }
};

/**
 * Get completed musician sessions by musician ID
 * @param musicianId The ID of the musician
 * @param count Number of sessions to retrieve (default 100)
 * @returns Array of completed sessions
 */
export const getCompletedMusicianSessions = async (
  musicianId: string,
  count: number = 100
) => {
  try {
    const q = query(
      collection(db, COMPLETED_MUSICIAN_SESSIONS_COLLECTION),
      where("musicianId", "==", musicianId),
      // Order by checkout time, descending
      limit(count)
    );
    const querySnapshot = await getDocs(q);
    const sessions: any[] = [];
    querySnapshot.forEach((doc) => {
      sessions.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, data: sessions };
  } catch (error) {
    console.error("Error getting completed musician sessions:", error);
    return { success: false, error };
  }
};

/**
 * Get all active musician sessions (likely for admin use)
 * @returns Array of all active musician sessions
 */
export const getAllActiveMusicianSessions = async () => {
  try {
    const q = query(
      collection(db, ACTIVE_MUSICIAN_SESSIONS_COLLECTION),
      orderBy("signInTimeTimestamp", "desc")
    );
    const querySnapshot = await getDocs(q);
    const sessions: any[] = [];
    querySnapshot.forEach((doc) => {
      sessions.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, data: sessions };
  } catch (error) {
    console.error(
      "Error getting all active musician sessions from Firestore:",
      error
    );
    return { success: false, error };
  }
};

/**
 * Get all completed musician sessions (likely for admin use)
 * @param count Number of sessions to retrieve (default 100)
 * @returns Array of all completed musician sessions
 */
export const getAllCompletedMusicianSessions = async (count: number = 100) => {
  try {
    const q = query(
      collection(db, COMPLETED_MUSICIAN_SESSIONS_COLLECTION),
      orderBy("checkOutTimeTimestamp", "desc"),
      limit(count)
    );
    const querySnapshot = await getDocs(q);
    const sessions: any[] = [];
    querySnapshot.forEach((doc) => {
      sessions.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, data: sessions };
  } catch (error) {
    console.error(
      "Error getting all completed musician sessions from Firestore:",
      error
    );
    return { success: false, error };
  }
};

/**
 * Get the current daily code
 * @returns The daily code data or null if not found/expired
 */
export const getDailyCode = async () => {
  try {
    const docRef = doc(db, CONFIG_COLLECTION, "dailyCode");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const codeData = docSnap.data();
      // Check if expiresAt is a Firestore Timestamp and convert if needed
      const expiresAtDate = codeData.expiresAt?.toDate
        ? codeData.expiresAt.toDate()
        : new Date(codeData.expiresAt); // Fallback if stored as string

      if (expiresAtDate > new Date()) {
        // Convert Timestamps back to ISO strings for consistency if needed client-side
        return {
          success: true,
          data: {
            ...codeData,
            expiresAt: expiresAtDate.toISOString(),
            createdAt: codeData.createdAt?.toDate
              ? codeData.createdAt.toDate().toISOString()
              : codeData.createdAt,
          },
        };
      } else {
        // Code expired
        return { success: false, message: "Daily code expired" };
      }
    } else {
      return { success: false, message: "Daily code not set" };
    }
  } catch (error) {
    console.error("Error getting daily code from Firestore:", error);
    return { success: false, error };
  }
};

/**
 * Save or update the daily code
 * @param codeData - The code data including code, expiresAt, createdBy
 * @returns Promise that resolves when the code is saved
 */
export const saveDailyCode = async (codeData: {
  code: string;
  expiresAt: string; // ISO String
  createdBy: string;
}) => {
  try {
    const docRef = doc(db, CONFIG_COLLECTION, "dailyCode");
    const dataToSave = {
      ...codeData,
      expiresAt: Timestamp.fromDate(new Date(codeData.expiresAt)), // Store as Timestamp
      createdAt: serverTimestamp(), // Use server timestamp for creation/update time
      updatedAt: serverTimestamp(),
    };
    // Use setDoc with merge: true or updateDoc to handle existing doc
    await setDoc(docRef, dataToSave, { merge: true });
    return { success: true };
  } catch (error) {
    console.error("Error saving daily code to Firestore:", error);
    return { success: false, error };
  }
};

/**
 * Save a code audit log entry
 * @param logEntry - The audit log entry data
 * @returns Promise resolving with the ID of the new log entry
 */
export const saveCodeAuditLogEntry = async (logEntry: {
  code: string;
  action: "created" | "updated" | "generated";
  adminId: string;
}) => {
  try {
    const entryWithTimestamp = {
      ...logEntry,
      timestamp: serverTimestamp(), // Use server timestamp
    };
    const docRef = await addDoc(
      collection(db, CODE_AUDIT_LOG_COLLECTION),
      entryWithTimestamp
    );
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error saving code audit log entry:", error);
    return { success: false, error };
  }
};

/**
 * Get the latest code audit log entries
 * @param count - Number of entries to retrieve (default 100)
 * @returns Array of audit log entries
 */
export const getCodeAuditLog = async (count: number = 100) => {
  try {
    const q = query(
      collection(db, CODE_AUDIT_LOG_COLLECTION),
      orderBy("timestamp", "desc"),
      limit(count)
    );
    const querySnapshot = await getDocs(q);
    const logs: any[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      logs.push({
        id: doc.id,
        ...data,
        // Convert timestamp to ISO string for client-side consistency
        timestamp: data.timestamp?.toDate
          ? data.timestamp.toDate().toISOString()
          : null,
      });
    });
    return { success: true, data: logs };
  } catch (error) {
    console.error("Error getting code audit log from Firestore:", error);
    return { success: false, error };
  }
};

/**
 * Migrate localStorage sessions to Firestore
 * @returns Promise that resolves when migration is complete
 */
export const migrateSessionsToFirestore = async () => {
  try {
    // Migrate active volunteers
    const activeVolunteersJson = localStorage.getItem("activeVolunteers");
    if (activeVolunteersJson) {
      const activeVolunteers = JSON.parse(activeVolunteersJson);
      const activePromises = activeVolunteers.map((session: any) =>
        saveActiveVolunteerSession(session)
      );
      await Promise.all(activePromises);
    }

    // Migrate completed sessions
    const completedSessionsJson = localStorage.getItem("completedSessions");
    if (completedSessionsJson) {
      const completedSessions = JSON.parse(completedSessionsJson);
      const completedPromises = completedSessions.map((session: any) => {
        const sessionId = `${session.volunteerInfo?.id || "unknown"}_${new Date(
          session.checkInTime
        ).getTime()}`;
        return setDoc(
          doc(db, COMPLETED_VOLUNTEER_SESSIONS_COLLECTION, sessionId),
          {
            ...session,
            createdAt: session.createdAt
              ? Timestamp.fromDate(new Date(session.createdAt))
              : Timestamp.now(),
            checkInTimeTimestamp: Timestamp.fromDate(
              new Date(session.checkInTime)
            ),
            checkOutTimeTimestamp: session.checkOutTime
              ? Timestamp.fromDate(new Date(session.checkOutTime))
              : null,
          }
        );
      });
      await Promise.all(completedPromises);
    }

    // Add migration for musician data if it exists in localStorage
    const musiciansJson = localStorage.getItem("musicians");
    if (musiciansJson) {
      const musicians = JSON.parse(musiciansJson);
      const musicianPromises = musicians.map((m: any) => saveMusician(m));
      await Promise.all(musicianPromises);
    }

    const musicianSignInsJson = localStorage.getItem("musicianSignIns");
    if (musicianSignInsJson) {
      const musicianSignIns = JSON.parse(musicianSignInsJson);
      const musicianSessionPromises = musicianSignIns.map((session: any) => {
        if (session.checkOutTime) {
          // Completed session
          const sessionId = `${session.musicianId}_${new Date(
            session.signInTime
          ).getTime()}`;
          return setDoc(
            doc(db, COMPLETED_MUSICIAN_SESSIONS_COLLECTION, sessionId),
            {
              ...session,
              signInTimeTimestamp: Timestamp.fromDate(
                new Date(session.signInTime)
              ),
              checkOutTimeTimestamp: Timestamp.fromDate(
                new Date(session.checkOutTime)
              ),
              createdAt: Timestamp.now(), // Add a creation timestamp
            }
          );
        } else {
          // Active session
          return saveActiveMusicianSession(session);
        }
      });
      await Promise.all(musicianSessionPromises);
    }

    return {
      success: true,
      message: "Successfully migrated data to Firestore",
    };
  } catch (error) {
    console.error("Error migrating sessions to Firestore:", error);
    return { success: false, error };
  }
};

/**
 * Migrate volunteers from localStorage to Firestore
 * @returns Promise that resolves when migration is complete
 */
export const migrateLocalStorageToFirestore = async () => {
  try {
    // Get volunteers from localStorage
    const volunteersJson = localStorage.getItem("volunteers");
    if (volunteersJson) {
      const volunteers = JSON.parse(volunteersJson);
      const migrationPromises = volunteers.map((volunteer: any) =>
        saveVolunteer(volunteer)
      );
      await Promise.all(migrationPromises);
    } else {
      console.log("No volunteers found in localStorage to migrate.");
    }

    // Also migrate sessions and musician data
    const sessionMigrationResult = await migrateSessionsToFirestore();
    if (!sessionMigrationResult.success) {
      // Propagate the error if session migration failed
      throw (
        sessionMigrationResult.error || new Error("Session migration failed")
      );
    }

    return {
      success: true,
      message: `Successfully migrated available data to Firestore`,
    };
  } catch (error) {
    console.error("Error migrating data to Firestore:", error);
    return { success: false, error };
  }
};

/**
 * Get a volunteer by phone number
 * @param phone - The phone number to search for
 * @returns The volunteer data or null if not found
 */
export const getVolunteerByPhone = async (phone: string) => {
  try {
    // Normalize the phone number (remove non-digit characters)
    const normalizedPhone = phone.replace(/\D/g, "");

    // Query Firestore for the volunteer with this phone number
    const q = query(
      collection(db, VOLUNTEERS_COLLECTION),
      where("phone", "==", normalizedPhone)
    );
    const querySnapshot = await getDocs(q);

    const volunteers: any[] = [];
    querySnapshot.forEach((doc) => {
      volunteers.push({ id: doc.id, ...doc.data() });
    });

    return { success: true, data: volunteers };
  } catch (error) {
    console.error("Error getting volunteer by phone:", error);
    return { success: false, error };
  }
};

/**
 * Get a musician by phone number
 * @param phone - The phone number to search for
 * @returns The musician data or null if not found
 */
export const getMusicianByPhone = async (phone: string) => {
  try {
    // Normalize the phone number (remove non-digit characters)
    const normalizedPhone = phone.replace(/\D/g, "");

    // Query Firestore for the musician with this phone number
    const q = query(
      collection(db, MUSICIANS_COLLECTION),
      where("phone", "==", normalizedPhone)
    );
    const querySnapshot = await getDocs(q);

    const musicians: any[] = [];
    querySnapshot.forEach((doc) => {
      musicians.push({ id: doc.id, ...doc.data() });
    });

    return { success: true, data: musicians };
  } catch (error) {
    console.error("Error getting musician by phone:", error);
    return { success: false, error };
  }
};

/**
 * Get a musician by ID
 * @param musicianId - The ID of the musician to retrieve
 * @returns The musician data or null if not found
 */
export const getMusicianById = async (musicianId: string) => {
  try {
    const docRef = doc(db, MUSICIANS_COLLECTION, musicianId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      // Include the ID in the returned data
      return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
    } else {
      return { success: false, error: "Musician not found" };
    }
  } catch (error) {
    console.error("Error getting musician from Firestore:", error);
    return { success: false, error };
  }
};

/**
 * Save a donation to Firestore
 * @param donation - The donation data to save
 * @returns Promise that resolves when the donation is saved
 */
export const saveDonation = async (donation: any) => {
  try {
    // Create a clean copy of the donation object
    const cleanDonation = { ...donation };

    // Handle waiverSignature - Firestore can't store complex objects
    if (cleanDonation.waiverSignature) {
      // If it's a string (base64), keep it as is
      if (typeof cleanDonation.waiverSignature === "string") {
        // Truncate if extremely long (Firestore has 1MB document size limit)
        if (cleanDonation.waiverSignature.length > 900000) {
          // ~900KB limit to be safe
          console.warn("Signature is too large, truncating");
          cleanDonation.waiverSignature =
            cleanDonation.waiverSignature.substring(0, 900000);
        }
      }
      // If it's an object with base64 property, extract it
      else if (cleanDonation.waiverSignature.base64) {
        cleanDonation.waiverSignature =
          cleanDonation.waiverSignature.base64;
      }
      // If we can't handle it, remove it
      else if (typeof cleanDonation.waiverSignature !== "string") {
        console.warn(
          "Removing unsupported waiverSignature format:",
          Object.prototype.toString.call(cleanDonation.waiverSignature)
        );
        cleanDonation.waiverSignature = "";
      }
    }

    // Add timestamp (only if not already set)
    if (!cleanDonation.submittedAt) {
      cleanDonation.submittedAt = Timestamp.now();
    }
    if (!cleanDonation.submissionDate) {
      cleanDonation.submissionDate = new Date().toISOString();
    }

    // Use the donation's ID as the document ID (should always exist)
    const donationId = cleanDonation.id;
    if (!donationId) {
      throw new Error("Donation ID is required");
    }
    await setDoc(doc(db, DONATIONS_COLLECTION, donationId), cleanDonation);
    return { success: true, id: donationId };
  } catch (error) {
    console.error("Error saving donation to Firestore:", error);
    return { success: false, error };
  }
};

/**
 * Get all donations
 * @returns Array of all donations
 */
export const getAllDonations = async () => {
  try {
    const q = query(
      collection(db, DONATIONS_COLLECTION),
      orderBy("submittedAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    const donations: any[] = [];
    querySnapshot.forEach((doc) => {
      donations.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, data: donations };
  } catch (error) {
    console.error("Error getting all donations from Firestore:", error);
    return { success: false, error };
  }
};

/**
 * Get a donation by ID
 * @param donationId - The ID of the donation to retrieve
 * @returns The donation data or null if not found
 */
export const getDonationById = async (donationId: string) => {
  try {
    const docRef = doc(db, DONATIONS_COLLECTION, donationId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
    } else {
      return { success: false, error: "Donation not found" };
    }
  } catch (error) {
    console.error("Error getting donation from Firestore:", error);
    return { success: false, error };
  }
};

/**
 * Get a volunteer by email
 * @param email - The email to search for
 * @returns The volunteer data or null if not found
 */
export const getVolunteerByEmail = async (email: string) => {
  try {
    // Query Firestore for the volunteer with this email
    const q = query(
      collection(db, VOLUNTEERS_COLLECTION),
      where("email", "==", email)
    );
    const querySnapshot = await getDocs(q);

    const volunteers: any[] = [];
    querySnapshot.forEach((doc) => {
      volunteers.push({ id: doc.id, ...doc.data() });
    });

    return { success: true, data: volunteers };
  } catch (error) {
    console.error("Error getting volunteer by email:", error);
    return { success: false, error };
  }
};

/**
 * Get a musician by email
 * @param email - The email to search for
 * @returns The musician data or null if not found
 */
export const getMusicianByEmail = async (email: string) => {
  try {
    // Query Firestore for the musician with this email
    const q = query(
      collection(db, MUSICIANS_COLLECTION),
      where("email", "==", email)
    );
    const querySnapshot = await getDocs(q);

    const musicians: any[] = [];
    querySnapshot.forEach((doc) => {
      musicians.push({ id: doc.id, ...doc.data() });
    });

    return { success: true, data: musicians };
  } catch (error) {
    console.error("Error getting musician by email:", error);
    return { success: false, error };
  }
};

// Export auth functions
export { auth, signInWithEmailAndPassword, signOut, onAuthStateChanged };

export { db };

// Function to check if a volunteer with the same email or phone already exists
export async function checkDuplicateVolunteer(
  email: string,
  phone: string
): Promise<{ isDuplicate: boolean; message?: string }> {
  try {
    if (!email && !phone) {
      // If neither email nor phone is provided, can't check for duplicates
      return { isDuplicate: false };
    }

    const db = getFirestore();
    let queryConstraints = [];

    // Add constraints based on provided fields
    if (email && email.trim() !== "") {
      queryConstraints.push(where("email", "==", email));
    }

    if (phone && phone.trim() !== "") {
      queryConstraints.push(where("phone", "==", phone));
    }

    // If we have at least one constraint
    if (queryConstraints.length > 0) {
      // Create a query with OR condition for email or phone
      const q = query(
        collection(db, VOLUNTEERS_COLLECTION),
        or(...queryConstraints)
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // Check what field caused the duplicate
        let duplicateField = "";
        querySnapshot.forEach((doc) => {
          const volData = doc.data();
          if (email && volData.email === email) {
            duplicateField = "email";
          } else if (phone && volData.phone === phone) {
            duplicateField = "phone";
          }
        });

        return {
          isDuplicate: true,
          message: `A volunteer with this ${duplicateField} already exists.`,
        };
      }
    }

    return { isDuplicate: false };
  } catch (error) {
    console.error("Error checking for duplicate volunteer:", error);
    return { isDuplicate: false };
  }
}

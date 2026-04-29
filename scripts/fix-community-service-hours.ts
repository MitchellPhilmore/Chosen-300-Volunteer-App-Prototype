#!/usr/bin/env node
/**
 * Script to fix community service volunteer sessions with over 6 hours
 * 
 * This script:
 * 1. Finds all completed community service sessions with > 6 hours
 * 2. Caps them at 6 hours by adjusting checkOutTime and hoursWorked
 * 3. Updates the database accordingly
 * 
 * Usage: npm run fix-cs-hours
 * Or: npx tsx scripts/fix-community-service-hours.ts
 */

// Load environment variables
import { config } from "dotenv";
config();

import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  updateDoc,
  Timestamp,
} from "firebase/firestore";

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Validate Firebase configuration
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error("❌ Error: Missing required Firebase configuration!");
  console.error("   Please ensure NEXT_PUBLIC_FIREBASE_API_KEY and NEXT_PUBLIC_FIREBASE_PROJECT_ID are set.");
  console.error("\n   Current config:");
  console.error(`   - apiKey: ${firebaseConfig.apiKey ? "✓" : "✗"}`);
  console.error(`   - projectId: ${firebaseConfig.projectId ? "✓" : "✗"}`);
  process.exit(1);
}

// Initialize Firebase
console.log("🔧 Initializing Firebase...");
console.log(`   Project ID: ${firebaseConfig.projectId}`);
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const COMPLETED_VOLUNTEER_SESSIONS_COLLECTION = "completedVolunteerSessions";
const MAX_HOURS_PER_SESSION = 6;

interface VolunteerSession {
  id: string;
  identifier: string;
  location: string;
  checkInTime: string;
  checkOutTime?: string;
  hoursWorked?: string;
  volunteerInfo: {
    id: string;
    firstName: string;
    lastName: string;
  };
  rating?: number;
  comments?: string;
  isCommunityServiceSession?: boolean;
  checkInTimeTimestamp?: Timestamp;
  checkOutTimeTimestamp?: Timestamp;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  [key: string]: any; // Allow other fields
}

/**
 * Convert Firestore Timestamp to Date
 */
function timestampToDate(timestamp: Timestamp | any): Date {
  if (timestamp?.toDate) {
    return timestamp.toDate();
  }
  if (timestamp instanceof Date) {
    return timestamp;
  }
  return new Date(timestamp);
}

/**
 * Calculate hours between two dates
 */
function calculateHours(start: Date, end: Date): number {
  return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
}

/**
 * Cap a session at 6 hours by adjusting checkOutTime
 */
function capSessionAtMaxHours(session: VolunteerSession): {
  checkOutTime: string;
  checkOutTimeTimestamp: Timestamp;
  hoursWorked: string;
  originalHours: number;
} {
  const checkIn = timestampToDate(
    session.checkInTimeTimestamp || new Date(session.checkInTime)
  );
  const originalCheckOut = timestampToDate(
    session.checkOutTimeTimestamp || new Date(session.checkOutTime || Date.now())
  );

  const originalHours = calculateHours(checkIn, originalCheckOut);
  
  // Calculate new checkout time (6 hours from check-in)
  const newCheckOut = new Date(
    checkIn.getTime() + MAX_HOURS_PER_SESSION * 60 * 60 * 1000
  );

  return {
    checkOutTime: newCheckOut.toISOString(),
    checkOutTimeTimestamp: Timestamp.fromDate(newCheckOut),
    hoursWorked: MAX_HOURS_PER_SESSION.toFixed(2),
    originalHours,
  };
}

/**
 * Main function to fix community service sessions
 */
async function fixCommunityServiceSessions() {
  console.log("🔍 Starting fix for community service sessions with > 6 hours...\n");

  try {
    // Get all completed volunteer sessions
    // Note: We don't use orderBy because some documents might not have checkOutTimeTimestamp
    console.log("📥 Fetching all completed volunteer sessions...");
    console.log(`   Collection: ${COMPLETED_VOLUNTEER_SESSIONS_COLLECTION}`);
    
    const collectionRef = collection(db, COMPLETED_VOLUNTEER_SESSIONS_COLLECTION);
    
    console.log("   Executing query...");
    let querySnapshot;
    try {
      querySnapshot = await getDocs(collectionRef);
    } catch (queryError: any) {
      console.error("   ❌ Query error:", queryError.message);
      console.error("   Error code:", queryError.code);
      console.error("   Full error:", queryError);
      throw queryError;
    }

    const allSessions: VolunteerSession[] = [];
    querySnapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      allSessions.push({
        id: docSnapshot.id,
        ...data,
      } as VolunteerSession);
    });
    
    // Sort in memory by checkOutTimeTimestamp if available
    allSessions.sort((a, b) => {
      const aTime = a.checkOutTimeTimestamp?.toMillis?.() || 
                   (a.checkOutTime ? new Date(a.checkOutTime).getTime() : 0);
      const bTime = b.checkOutTimeTimestamp?.toMillis?.() || 
                   (b.checkOutTime ? new Date(b.checkOutTime).getTime() : 0);
      return bTime - aTime; // Descending order
    });

    console.log(`   Found ${allSessions.length} total completed sessions\n`);

    // Debug: Show sample session structure
    if (allSessions.length > 0) {
      console.log("📋 Sample session structure:");
      const sample = allSessions[0];
      console.log(`   - ID: ${sample.id}`);
      console.log(`   - isCommunityServiceSession: ${sample.isCommunityServiceSession}`);
      console.log(`   - hoursWorked: ${sample.hoursWorked}`);
      console.log(`   - checkOutTimeTimestamp: ${sample.checkOutTimeTimestamp ? 'exists' : 'missing'}`);
      console.log(`   - volunteerInfo: ${sample.volunteerInfo ? 'exists' : 'missing'}`);
      console.log();
    }

    // Filter for community service sessions with > 6 hours
    // Also include sessions that might be missing the flag but have > 6 hours (likely CS)
    const problematicSessions = allSessions.filter((session) => {
      const hoursWorked = parseFloat(session.hoursWorked || "0");
      
      // Include if explicitly marked as community service OR if hours > 6 (likely CS)
      const isCommunityService = session.isCommunityServiceSession === true;
      const hasExcessiveHours = hoursWorked > MAX_HOURS_PER_SESSION;
      
      return (isCommunityService || hasExcessiveHours) && hasExcessiveHours;
    });

    console.log(
      `⚠️  Found ${problematicSessions.length} community service sessions with > ${MAX_HOURS_PER_SESSION} hours\n`
    );

    if (problematicSessions.length === 0) {
      console.log("✅ No sessions need fixing. All done!");
      return;
    }

    // Display summary
    console.log("📊 Sessions to fix:");
    problematicSessions.forEach((session, index) => {
      const hours = parseFloat(session.hoursWorked || "0");
      const csFlag = session.isCommunityServiceSession ? "✓" : "✗";
      console.log(
        `   ${index + 1}. ${session.volunteerInfo?.firstName || "Unknown"} ${
          session.volunteerInfo?.lastName || ""
        } - ${hours.toFixed(2)} hours (CS: ${csFlag}) (ID: ${session.id})`
      );
    });
    console.log();

    // Ask for confirmation (in a real script, you might want to add a prompt)
    console.log("🔄 Processing sessions...\n");

    let fixedCount = 0;
    let errorCount = 0;

    for (const session of problematicSessions) {
      try {
        const originalHours = parseFloat(session.hoursWorked || "0");
        console.log(
          `   Processing: ${session.volunteerInfo?.firstName || "Unknown"} ${
            session.volunteerInfo?.lastName || ""
          } - ${originalHours.toFixed(2)} hours → capping at ${MAX_HOURS_PER_SESSION} hours`
        );

        // Cap the session at 6 hours
        const cappedData = capSessionAtMaxHours(session);
        
        // Update the session in Firestore
        await updateDoc(
          doc(db, COMPLETED_VOLUNTEER_SESSIONS_COLLECTION, session.id),
          {
            checkOutTime: cappedData.checkOutTime,
            checkOutTimeTimestamp: cappedData.checkOutTimeTimestamp,
            hoursWorked: cappedData.hoursWorked,
            isCommunityServiceSession: true, // Ensure flag is set to true
            updatedAt: Timestamp.now(),
            // Add metadata to track that this was capped
            _cappedFrom: originalHours.toFixed(2),
            _cappedAt: new Date().toISOString(),
          }
        );
        
        const wasCsFlagged = session.isCommunityServiceSession ? "already flagged" : "now flagged";
        console.log(
          `      → Updated: ${originalHours.toFixed(2)}h → ${cappedData.hoursWorked}h (CS: ${wasCsFlagged})`
        );
        console.log();

        fixedCount++;
      } catch (error) {
        console.error(`      ❌ Error processing session ${session.id}:`, error);
        errorCount++;
      }
    }

    console.log("\n✅ Fix complete!");
    console.log(`   Fixed: ${fixedCount} sessions`);
    if (errorCount > 0) {
      console.log(`   Errors: ${errorCount} sessions`);
    }
  } catch (error) {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  }
}

// Run the script
fixCommunityServiceSessions()
  .then(() => {
    console.log("\n✨ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });


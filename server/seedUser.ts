import { db } from "./db";
import { users, userStats, accounts } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function seedDefaultUser() {
  const defaultUserId = "demo-user-1";
  
  try {
    console.log("Checking for default user...");
    
    // Check if default user already exists
    const existingUser = await db.select().from(users).where(eq(users.id, defaultUserId)).limit(1);
    
    if (existingUser.length === 0) {
      console.log("Creating default user for development...");
      
      // Create default user
      await db.insert(users).values({
        id: defaultUserId,
        email: "demo@tradingjournal.com",
        firstName: "Usuario",
        lastName: "Demo",
        profileImageUrl: null,
      });

      // Create default user stats
      await db.insert(userStats).values({
        userId: defaultUserId,
        currentLevel: 1,
        currentPoints: 0,
        totalProfitabledays: 0,
        totalRiskControlDays: 0,
        consecutiveProfitableDays: 0,
        accountSize: 100000.0,
      });

      // Create default account
      await db.insert(accounts).values({
        userId: defaultUserId,
        name: "Cuenta Demo",
        accountNumber: "DEMO-001",
        broker: "MetaTrader 5",
        currency: "USD",
        initialBalance: "100000.00",
        isActive: true,
      });

      console.log("Default user and account created successfully!");
    } else {
      console.log("Default user already exists, skipping seed...");
    }
  } catch (error) {
    console.error("Error seeding default user:", error);
    // Don't throw the error - just log it and continue
    console.log("Continuing without seeding default user...");
  }
}
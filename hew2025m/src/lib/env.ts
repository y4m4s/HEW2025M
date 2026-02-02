import { z } from "zod";

const clientSchema = z.object({
    NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1),
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1),
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1),
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().min(1),
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1),
    NEXT_PUBLIC_FIREBASE_APP_ID: z.string().min(1),
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: z.string().optional(),
    NEXT_PUBLIC_STRIPE_PUBLIC_KEY: z.string().optional(),
});

const serverSchema = z.object({
    MONGODB_URI: z.string().min(1),
    FIREBASE_CLIENT_EMAIL: z.string().optional(),
    FIREBASE_PRIVATE_KEY: z.string().optional(),
    STRIPE_SECRET_KEY: z.string().optional(),
});

// Explicitly define processEnv to allowing Next.js/Webpack to inline the values at build time
// This is critical for client-side execution
const processEnv = {
    // Client
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
    NEXT_PUBLIC_STRIPE_PUBLIC_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY,
    // Server
    MONGODB_URI: process.env.MONGODB_URI,
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
};

let envData: z.infer<typeof clientSchema> & Partial<z.infer<typeof serverSchema>>;

if (typeof window === "undefined") {
    // Server-side: Validate everything (Client + Server keys)
    // Merge schemas to validate all keys present
    const mergedSchema = clientSchema.merge(serverSchema);
    const parsed = mergedSchema.safeParse(processEnv);

    if (!parsed.success) {
        console.error("❌ Invalid environment variables (Server):", parsed.error.format());
        throw new Error("Invalid environment variables");
    }
    envData = parsed.data;
} else {
    // Client-side: Validate only public keys
    const parsed = clientSchema.safeParse(processEnv);

    if (!parsed.success) {
        console.error("❌ Invalid environment variables (Client):", parsed.error.format());
        throw new Error("Invalid environment variables");
    }

    // On client, server keys are undefined (or empty string/missing)
    envData = {
        ...parsed.data,
        MONGODB_URI: undefined,
        FIREBASE_CLIENT_EMAIL: undefined,
        FIREBASE_PRIVATE_KEY: undefined,
        STRIPE_SECRET_KEY: undefined,
    };
}

export const env = envData as z.infer<typeof clientSchema> & z.infer<typeof serverSchema>;

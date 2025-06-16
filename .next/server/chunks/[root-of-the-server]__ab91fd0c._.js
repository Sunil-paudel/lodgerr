module.exports = {

"[project]/.next-internal/server/app/api/upload/route/actions.js [app-rsc] (server actions loader, ecmascript)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
}}),
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}}),
"[externals]/@opentelemetry/api [external] (@opentelemetry/api, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("@opentelemetry/api", () => require("@opentelemetry/api"));

module.exports = mod;
}}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}}),
"[externals]/crypto [external] (crypto, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}}),
"[externals]/querystring [external] (querystring, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("querystring", () => require("querystring"));

module.exports = mod;
}}),
"[externals]/url [external] (url, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("url", () => require("url"));

module.exports = mod;
}}),
"[externals]/fs [external] (fs, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("fs", () => require("fs"));

module.exports = mod;
}}),
"[externals]/path [external] (path, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("path", () => require("path"));

module.exports = mod;
}}),
"[externals]/https [external] (https, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("https", () => require("https"));

module.exports = mod;
}}),
"[externals]/http [external] (http, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("http", () => require("http"));

module.exports = mod;
}}),
"[externals]/stream [external] (stream, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("stream", () => require("stream"));

module.exports = mod;
}}),
"[project]/src/lib/cloudinary.ts [app-route] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "cloudinaryConfigError": (()=>cloudinaryConfigError),
    "cloudinaryInstance": (()=>cloudinaryInstance)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cloudinary$2f$cloudinary$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/cloudinary/cloudinary.js [app-route] (ecmascript)");
;
let cloudinaryInstance = null;
let cloudinaryConfigError = null;
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;
const errors = [];
if (!cloudName) {
    errors.push('CLOUDINARY_CLOUD_NAME is not set.');
}
if (!apiKey) {
    errors.push('CLOUDINARY_API_KEY is not set.');
}
if (!apiSecret) {
    errors.push('CLOUDINARY_API_SECRET is not set.');
}
if (errors.length > 0) {
    cloudinaryConfigError = `Cloudinary configuration error: ${errors.join(' ')} Image uploads will fail.`;
    console.error(`[Cloudinary Lib] ${cloudinaryConfigError}`);
} else {
    try {
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cloudinary$2f$cloudinary$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["v2"].config({
            cloud_name: cloudName,
            api_key: apiKey,
            api_secret: apiSecret,
            secure: true
        });
        cloudinaryInstance = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cloudinary$2f$cloudinary$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["v2"];
        console.log('[Cloudinary Lib] Configured successfully.');
    } catch (e) {
        cloudinaryConfigError = `Failed to configure Cloudinary during init: ${e.message}`;
        console.error(`[Cloudinary Lib] ${cloudinaryConfigError}`);
    }
}
;
}}),
"[externals]/util [external] (util, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("util", () => require("util"));

module.exports = mod;
}}),
"[externals]/assert [external] (assert, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("assert", () => require("assert"));

module.exports = mod;
}}),
"[externals]/buffer [external] (buffer, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("buffer", () => require("buffer"));

module.exports = mod;
}}),
"[externals]/zlib [external] (zlib, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("zlib", () => require("zlib"));

module.exports = mod;
}}),
"[externals]/events [external] (events, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("events", () => require("events"));

module.exports = mod;
}}),
"[externals]/mongoose [external] (mongoose, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("mongoose", () => require("mongoose"));

module.exports = mod;
}}),
"[project]/src/utils/db.ts [app-route] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/mongoose [external] (mongoose, cjs)");
;
__TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].set('strictQuery', false);
// Ensure this MONGODB_URL is correct and your IP is whitelisted if using Atlas.
const MONGODB_URL = "mongodb+srv://paudelsunil16:paudelsunil16@cluster0.dlua3bq.mongodb.net/";
const connectDB = async ()=>{
    if (__TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].connection.readyState >= 1) {
        console.log("MongoDB is already connected.");
        return;
    }
    try {
        if ("TURBOPACK compile-time falsy", 0) {
            "TURBOPACK unreachable";
        }
        console.log("[DB Connect] Attempting to connect to MongoDB...");
        await __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].connect(MONGODB_URL);
        console.log("[DB Connect] MongoDB connected successfully.");
    } catch (error) {
        console.error("[DB Connect] MongoDB connection failed:", error.message);
        if (error.stack) {
            console.error("[DB Connect] MongoDB connection error stack:", error.stack);
        } else {
            console.error("[DB Connect] MongoDB connection error details:", error);
        }
        // Construct a new error to ensure it's an Error instance with a clear message
        throw new Error("Database connection failed: " + error.message);
    }
};
const __TURBOPACK__default__export__ = connectDB;
}}),
"[project]/src/models/User.ts [app-route] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/mongoose [external] (mongoose, cjs)");
;
// Define the user schema
const userSchema = new __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["Schema"]({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    passwordHash: {
        type: String
    },
    role: {
        type: String,
        enum: [
            "guest",
            "host",
            "admin"
        ],
        default: "guest"
    },
    stripeAccountId: {
        type: String
    },
    avatarUrl: {
        type: String
    }
}, {
    timestamps: true
});
const __TURBOPACK__default__export__ = __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].models.User || __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].model("User", userSchema);
}}),
"[project]/src/app/api/auth/[...nextauth]/route.ts [app-route] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "GET": (()=>handler),
    "POST": (()=>handler),
    "authOptions": (()=>authOptions)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next-auth/index.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$providers$2f$credentials$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next-auth/providers/credentials.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/bcryptjs/index.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/db.ts [app-route] (ecmascript)"); // MongoDB connection utility
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$User$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/models/User.ts [app-route] (ecmascript)"); // Mongoose User model
;
;
;
;
;
const authOptions = {
    // === Authentication Providers ===
    providers: [
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$providers$2f$credentials$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"])({
            id: "credentials",
            name: "Credentials",
            // Fields for sign-in formx
            credentials: {
                email: {
                    label: "Email",
                    type: "text",
                    placeholder: "jsmith@example.com"
                },
                password: {
                    label: "Password",
                    type: "password"
                }
            },
            // Core login logic
            async authorize (credentials) {
                console.log("[Authorize] Credentials received:", credentials ? {
                    email: credentials.email,
                    password_exists: !!credentials.password
                } : "null_credentials");
                // Validate input
                if (!credentials?.email || !credentials?.password) {
                    console.log("[Authorize] Missing email or password.");
                    throw new Error("Please enter both email and password.");
                }
                try {
                    console.log("[Authorize] Connecting to DB...");
                    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"])();
                    console.log("[Authorize] DB connection successful.");
                    const user = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$User$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].findOne({
                        email: credentials.email
                    });
                    if (!user) {
                        console.log("[Authorize] No user found with email:", credentials.email);
                        throw new Error("No user found with this email.");
                    }
                    if (!user.passwordHash) {
                        console.log("[Authorize] User has no password set:", credentials.email);
                        throw new Error("User account is not properly configured for password login.");
                    }
                    const isValidPassword = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].compare(credentials.password, user.passwordHash);
                    if (!isValidPassword) {
                        console.log("[Authorize] Incorrect password for:", credentials.email);
                        throw new Error("Invalid password.");
                    }
                    // Success: Return user data matching the `User` interface in next-auth.d.ts
                    console.log("[Authorize] Login success for user:", user._id.toString(), user.email);
                    return {
                        id: user._id.toString(),
                        name: user.name,
                        email: user.email,
                        image: user.avatarUrl,
                        role: user.role
                    };
                } catch (error) {
                    console.error("[Authorize] Unexpected error:", error.message, error.stack);
                    // Re-throw specific known errors for NextAuth to handle and potentially display to user
                    if ([
                        "No user found with this email.",
                        "Invalid password.",
                        "User account is not properly configured for password login.",
                        "Please enter both email and password."
                    ].includes(error.message) || error.message.startsWith("Database connection failed:") || error.message.startsWith("Server configuration error:")) {
                        throw error;
                    }
                    // For other unexpected errors, throw a generic message
                    throw new Error("Authentication failed due to an unexpected server issue. Please try again.");
                }
            }
        })
    ],
    // === Session Configuration ===
    session: {
        strategy: "jwt"
    },
    // === Callback Functions ===
    callbacks: {
        // Modify JWT on login or session update
        async jwt ({ token, user, trigger, session: newSessionData }) {
            // On initial sign in, the `user` object from `authorize` is available
            if (user) {
                console.log("[JWT Callback] Initial user object from authorize:", user);
                token.id = user.id;
                token.name = user.name;
                token.email = user.email;
                token.picture = user.image; // `user.image` from authorize maps to `token.picture`
                token.role = user.role;
            }
            // Handle session updates (e.g., user updates profile)
            if (trigger === "update" && newSessionData?.user) {
                console.log("[JWT Callback] Updating token from session update data:", newSessionData.user);
                token.name = newSessionData.user.name;
                token.email = newSessionData.user.email;
                token.picture = newSessionData.user.image;
                token.role = newSessionData.user.role;
            }
            console.log("[JWT Callback] Token before returning:", token);
            return token;
        },
        // Attach token data to session for use on client side
        async session ({ session, token }) {
            console.log("[Session Callback] Token received:", token);
            if (token) {
                // Ensure session.user exists and is structured according to `next-auth.d.ts`
                session.user = {
                    id: token.id,
                    name: token.name,
                    email: token.email,
                    image: token.picture,
                    role: token.role
                };
            }
            console.log("[Session Callback] Session user before returning:", session.user);
            return session;
        }
    },
    // === Custom Auth Pages ===
    pages: {
        signIn: "/login",
        error: "/login"
    },
    // === Secret for signing JWT ===
    secret: process.env.NEXTAUTH_SECRET
};
// Export for Next.js API routes
const handler = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"])(authOptions);
;
}}),
"[project]/src/app/api/upload/route.ts [app-route] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "POST": (()=>POST)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$cloudinary$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/cloudinary.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$next$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next-auth/next/index.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$api$2f$auth$2f5b2e2e2e$nextauth$5d2f$route$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/app/api/auth/[...nextauth]/route.ts [app-route] (ecmascript)");
;
;
;
;
async function POST(request) {
    console.log('[API /api/upload] Received POST request');
    if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$cloudinary$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cloudinaryConfigError"] || !__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$cloudinary$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cloudinaryInstance"]) {
        const errorMsg = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$cloudinary$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cloudinaryConfigError"] || 'Cloudinary service is not initialized on the server.';
        console.error(`[API /api/upload] Aborting: Cloudinary not configured. Error: ${errorMsg}`);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            message: 'Image upload service is not configured correctly on the server.',
            error: errorMsg
        }, {
            status: 503
        }); // 503 Service Unavailable
    }
    const session = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$next$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getServerSession"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$api$2f$auth$2f5b2e2e2e$nextauth$5d2f$route$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["authOptions"]);
    if (!session || !session.user) {
        console.log('[API /api/upload] Unauthorized access attempt.');
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            message: 'Unauthorized'
        }, {
            status: 401
        });
    }
    console.log('[API /api/upload] User authenticated:', session.user.email);
    const formData = await request.formData();
    const file = formData.get('file');
    if (!file) {
        console.log('[API /api/upload] No file provided in formData.');
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            message: 'No file provided.'
        }, {
            status: 400
        });
    }
    console.log(`[API /api/upload] File received: ${file.name}, type: ${file.type}, size: ${file.size}`);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    console.log('[API /api/upload] File converted to buffer.');
    try {
        console.log('[API /api/upload] Attempting to upload to Cloudinary...');
        const uploadResult = await new Promise((resolve, reject)=>{
            const stream = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$cloudinary$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cloudinaryInstance"].uploader.upload_stream({
                resource_type: 'image',
                folder: 'lodger_properties'
            }, (error, result)=>{
                if (error) {
                    console.error('[API /api/upload] Cloudinary Upload Stream Error:', error);
                    reject(error); // This rejection should be caught by the outer try...catch
                } else {
                    console.log('[API /api/upload] Cloudinary Upload Stream Success Result:', result);
                    resolve(result);
                }
            });
            stream.end(buffer);
        });
        if (uploadResult?.secure_url) {
            console.log('[API /api/upload] Image uploaded successfully. URL:', uploadResult.secure_url);
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                message: 'Image uploaded successfully',
                imageUrl: uploadResult.secure_url,
                publicId: uploadResult.public_id
            }, {
                status: 200
            });
        } else {
            console.error('[API /api/upload] Cloudinary upload failed to return a secure URL. Full result:', uploadResult);
            // This case might happen if Cloudinary returns a 200 OK but the result format is unexpected
            throw new Error('Cloudinary upload succeeded but response was malformed or lacked secure_url.');
        }
    } catch (error) {
        console.error('[API /api/upload] Overall Upload API Error (after buffer conversion):', error);
        let errorMessage = 'Image upload failed due to a server error.';
        if (error.message) {
            errorMessage = error.message;
        } else if (typeof error === 'object' && error.http_code) {
            errorMessage = `Cloudinary error: ${error.http_code} - ${error.message}`;
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            message: 'Image upload failed.',
            error: errorMessage
        }, {
            status: 500
        });
    }
}
}}),

};

//# sourceMappingURL=%5Broot-of-the-server%5D__ab91fd0c._.js.map
module.exports = {

"[project]/.next-internal/server/app/api/auth/signup/route/actions.js [app-rsc] (server actions loader, ecmascript)": (function(__turbopack_context__) {

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
"[externals]/mongoose [external] (mongoose, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("mongoose", () => require("mongoose"));

module.exports = mod;
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
"[externals]/crypto [external] (crypto, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}}),
"[project]/src/app/api/auth/signup/route.ts [app-route] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "POST": (()=>POST)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$User$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/models/User.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/db.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/bcryptjs/index.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
;
;
;
;
const POST = async (request)=>{
    try {
        const { fullName, email, password } = await request.json();
        console.log("[Signup API] Received request with data:", {
            fullName,
            email,
            password_exists: !!password
        });
        if (!fullName || !email || !password) {
            console.log("[Signup API] Missing required fields.");
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                message: "Missing required fields: fullName, email, and password."
            }, {
                status: 400
            });
        }
        console.log("[Signup API] Connecting to DB...");
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"])();
        console.log("[Signup API] DB connected.");
        // Explicitly log the email being searched for
        console.log("[Signup API] Checking for existing user with email:", email);
        const existingUser = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$User$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].findOne({
            email: email
        }); // Search by email
        if (existingUser) {
            // This block should ONLY be hit if the email already exists
            console.log("[Signup API] Found existing user with this email:", existingUser.toObject());
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                message: "This email address is already registered. Please use a different email or log in."
            }, {
                status: 409
            } // Conflict - for duplicate email
            );
        }
        console.log("[Signup API] No existing user found with email:", email);
        const hashedPassword = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].hash(password, 10);
        console.log("[Signup API] Password hashed successfully for email:", email);
        const newUser = new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$User$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"]({
            name: fullName,
            email,
            passwordHash: hashedPassword
        });
        // Log the object just before saving to ensure no unexpected 'id' field is present
        const userObjectToSave = newUser.toObject();
        if ('id' in userObjectToSave) {
            console.warn("[Signup API] Warning: 'id' field present on newUser object before save. This is unexpected as Mongoose uses '_id'. Object:", userObjectToSave);
        } else {
            console.log("[Signup API] New user object structure is as expected (no 'id' field, relies on '_id').");
        }
        console.log("[Signup API] Attempting to save new user object:", userObjectToSave);
        await newUser.save();
        console.log("[Signup API] User saved successfully:", {
            _id: newUser._id,
            email: newUser.email
        });
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            message: "User created successfully. You can now log in."
        }, {
            status: 201
        });
    } catch (err) {
        console.error("[Signup API] Error during signup process:", err);
        // Check for MongoDB duplicate key error (code 11000)
        if (err.code === 11000) {
            let DMessage = "A user with some of these details already exists. Please check your input.";
            console.log("[Signup API] MongoDB duplicate key error (E11000). Key pattern:", err.keyPattern);
            if (err.keyPattern) {
                const conflictingFields = Object.keys(err.keyPattern).join(', ');
                if (err.keyPattern.email) {
                    DMessage = `This email address is already registered. Please use a different email or log in.`;
                } else if (err.keyPattern.id) {
                    DMessage = `An account already exists with this ID. This is unexpected, please contact support or check database configuration.`;
                    console.error("[Signup API] Critical: Duplicate key error on 'id' field. This suggests a custom unique index on 'id' in the MongoDB collection which should be removed. Mongoose uses '_id'.");
                } else {
                    DMessage = `An account already exists with this ${conflictingFields}. Please use different details.`;
                }
                console.log("[Signup API] Conflicting fields from keyPattern:", conflictingFields);
            }
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                message: DMessage,
                errorDetails: `MongoDB E11000: Duplicate key on field(s): ${JSON.stringify(err.keyPattern)}`
            }, {
                status: 409
            } // Conflict
            );
        }
        // General server error
        let errorDetails = "Unknown server error.";
        if (err.name && err.message) {
            errorDetails = `${err.name}: ${err.message}`;
        } else if (err.message) {
            errorDetails = err.message;
        } else if (err.code) {
            errorDetails = `Error Code ${err.code}`;
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            message: "An internal server error occurred during signup. Please try again later.",
            errorDetails: errorDetails
        }, {
            status: 500
        });
    }
};
}}),

};

//# sourceMappingURL=%5Broot-of-the-server%5D__4ff67820._.js.map
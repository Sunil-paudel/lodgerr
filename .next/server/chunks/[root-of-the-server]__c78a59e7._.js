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
"[project]/src/app/api/upload/route.ts [app-route] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "POST": (()=>POST)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$cloudinary$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/cloudinary.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$stream__$5b$external$5d$__$28$stream$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/stream [external] (stream, cjs)");
;
;
;
// Helper function to convert NextRequest stream to Node.js Readable stream
async function requestToStream(request) {
    const reader = request.body?.getReader();
    if (!reader) {
        throw new Error('Failed to get reader from request body');
    }
    return new __TURBOPACK__imported__module__$5b$externals$5d2f$stream__$5b$external$5d$__$28$stream$2c$__cjs$29$__["Readable"]({
        async read () {
            const { done, value } = await reader.read();
            if (done) {
                this.push(null); // Signal end of stream
            } else {
                this.push(value);
            }
        }
    });
}
async function POST(request) {
    if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$cloudinary$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cloudinaryConfigError"]) {
        console.error('[API Upload] Cloudinary config error:', __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$cloudinary$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cloudinaryConfigError"]);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            message: "Image upload service is not configured correctly.",
            error: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$cloudinary$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cloudinaryConfigError"]
        }, {
            status: 503
        });
    }
    if (!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$cloudinary$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cloudinaryInstance"]) {
        console.error('[API Upload] Cloudinary instance not available.');
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            message: "Image upload service is unavailable.",
            error: "Cloudinary instance not initialized."
        }, {
            status: 503
        });
    }
    try {
        const formData = await request.formData();
        const file = formData.get('file');
        if (!file) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                message: 'No file provided.'
            }, {
                status: 400
            });
        }
        if (file.size === 0) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                message: 'Cannot upload an empty file.'
            }, {
                status: 400
            });
        }
        // Convert File to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        // Use a Promise to handle the stream upload
        const uploadResponse = await new Promise((resolve, reject)=>{
            const uploadStream = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$cloudinary$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cloudinaryInstance"].uploader.upload_stream({
                resource_type: 'image'
            }, (error, result)=>{
                if (error) {
                    console.error('[API Upload] Cloudinary upload error:', error);
                    return reject({
                        error
                    });
                }
                if (!result) {
                    console.error('[API Upload] Cloudinary returned no result.');
                    return reject({
                        error: new Error('Cloudinary returned no result after upload.')
                    });
                }
                return resolve({
                    secure_url: result.secure_url,
                    public_id: result.public_id
                });
            });
            // Create a new Readable stream from the buffer and pipe it
            __TURBOPACK__imported__module__$5b$externals$5d2f$stream__$5b$external$5d$__$28$stream$2c$__cjs$29$__["Readable"].from(buffer).pipe(uploadStream);
        });
        if (uploadResponse.error || !uploadResponse.secure_url) {
            const errorMessage = uploadResponse.error?.message || 'Unknown Cloudinary upload error.';
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                message: 'Failed to upload image.',
                error: errorMessage
            }, {
                status: 500
            });
        }
        console.log('[API Upload] File uploaded successfully to Cloudinary:', uploadResponse.secure_url);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            message: 'File uploaded successfully',
            imageUrl: uploadResponse.secure_url,
            publicId: uploadResponse.public_id
        }, {
            status: 200
        });
    } catch (error) {
        console.error('[API Upload] Error processing upload request:', error);
        let errorMessage = 'An unexpected error occurred during file upload.';
        if (error.message) {
            errorMessage = error.message;
        }
        // Check for specific error types if needed, e.g., body parsing errors
        if (error.type === 'entity.too.large') {
            errorMessage = 'File size exceeds server limit.';
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                message: errorMessage,
                error: 'FileTooLarge'
            }, {
                status: 413
            }); // Payload Too Large
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            message: 'Upload failed due to a server error.',
            error: errorMessage
        }, {
            status: 500
        });
    }
}
}}),

};

//# sourceMappingURL=%5Broot-of-the-server%5D__c78a59e7._.js.map